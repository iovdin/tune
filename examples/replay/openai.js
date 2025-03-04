module.exports = function(props) {
  return async function(payload, ctx) {
    const { auth_key, url } = props;
    delete props.auth_key;
    delete props.url;
    const key = await ctx.read('OPENAI_KEY' || auth_key);

    return ({
      url: url || "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: { 
        "content-type": "application/json",
        authorization: `Bearer ${key}` 
      },
      body: JSON.stringify({ 
        ...payload,
        ...props
      })
    })
  }
}
