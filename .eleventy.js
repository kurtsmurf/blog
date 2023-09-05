module.exports = function (config) {
  config.addPassthroughCopy("assets");
  config.setLiquidOptions({
    // required if you want to include partials in your templates
    dynamicPartials: true,
  });
};
