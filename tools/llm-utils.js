const path = require("path");
const fs = require("fs");

// Create cache directory if it doesn't exist
const cacheDir = path.join(__dirname, ".cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

/**
 * Creates a model cache manager for a specific provider
 * @param {string} providerName - Name of the provider (used for cache file)
 * @param {function} fetchModelsFunction - Function to fetch models from API
 * @returns {function} getModels function that handles caching
 */
function createModelCache(providerName, fetchModelsFunction) {
  const cacheFile = path.join(cacheDir, `${providerName}_models.json`);
  let cache;

  return async function getModels(...args) {
    if (cache) {
      return cache;
    }
    
    // Check if cache exists and is less than an hour old
    if (fs.existsSync(cacheFile)) {
      const stats = fs.statSync(cacheFile);
      const cacheAge = Date.now() - stats.mtimeMs;
      const oneHourMs = 60 * 60 * 1000; // 1 hour in milliseconds

      if (cacheAge < oneHourMs) {
        try {
          const cachedData = fs.readFileSync(cacheFile, "utf8");
          cache = JSON.parse(cachedData);
          return cache;
        } catch (error) {
          console.warn(`Error reading cache for ${providerName}:`, error);
          // Continue to fetch from API if cache reading fails
        }
      }
    }

    // Fetch from API if cache doesn't exist, is too old, or couldn't be read
    try {
      const models = await fetchModelsFunction(...args);
      cache = models;
      fs.writeFileSync(cacheFile, JSON.stringify(models, null, "  "), "utf8");
      return models;
    } catch (error) {
      console.error(`Error fetching models for ${providerName}:`, error);
      throw error;
    }
  };
}

/**
 * Creates a context provider function with standard environment and regex matching
 * @param {string} providerName - Name of the provider
 * @param {Object} options - Configuration options
 * @returns {function} Provider context function
 */
function createProviderContext(providerName, options) {
  const {
    apiKeyEnv,
    modelMatcher,
    modelFilter,
    createExecFunction,
    apiModelFetcher
  } = options;
  
  const getModels = createModelCache(providerName, apiModelFetcher);
  const envr = /^[A-Z_0-9]+$/;

  return async function providerContext(name, args) {
    // respond only to llm request or if type is 'any'
    if (args.type !== 'any' && args.type !== 'llm') {
      return;
    }
    
    const context = this;
    if (envr.test(name)) {
      return;
    }
    
    // Check if this model name should be handled by this provider
    if (modelMatcher && !modelMatcher(name)) {
      return;
    }
    
    const apiKey = await context.read(apiKeyEnv);
    if (!apiKey) {
      return;
    }

    try {
      const models = await getModels(apiKey);

      // Filter models based on name and args
      let matchedModels = [];
      if (modelFilter) {
        matchedModels = modelFilter(models, name, args);
      } else {
        // Default filter by exact match or regex
        let re;
        if (args.match === "regex") {
          re = new RegExp(name);
        }

        matchedModels = models.filter((item) => {
          if (args.match === "exact" && item.id === name) {
            return true;
          }
          if (re) {
            return re.test(item.id);
          }
          return false;
        });
      }

      if (!matchedModels.length) {
        return;
      }

      if (args.output === 'all') {
        return matchedModels.map(model => ({ 
          type: "llm", 
          name: model.id || model.name 
        }));
      }

      const model = matchedModels[0];
      return {
        type: "llm",
        exec: async (payload) => {
          // Get a fresh key in case it's rotated
          const key = await this.read(apiKeyEnv);
          return createExecFunction(model, payload, key, this);
        },
      };
    } catch (e ) {
      console.log(e)
      return
    }
  };
}

module.exports = {
  createModelCache,
  createProviderContext
};
