// /src/app/shims/raw-loader-shim.js
module.exports = function (content) {
  return `module.exports = ${JSON.stringify(content)};`;
};
