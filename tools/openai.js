module.exports = function(props, transform) {
  const { auth_key, url } = props;
  delete props.auth_key;
  delete props.url;
  return async function(payload, ctx) {
    const key = auth_key || await ctx.read('OPENAI_KEY');
    if (typeof(transform) === 'function') {
      payload = transform(payload)
    }

    const result =  ({
      url: url || "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: { 
        "content-type": "application/json",
        authorization: `Bearer ${key}` 
      },
      body: JSON.stringify({ 
        ...props,
        ...payload,
        messages: payload.messages.filter(msg => msg.role !== 'comment'),
      })
    })
    // console.log(result)
    return result
  }
}
