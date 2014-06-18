var path = require('path');
var file = require('fs-utils');
var _ = require('lodash');
var matter = require('gray-matter');

module.exports = function (data, options) {
  // Specify and exapnd the template(s) to use for each language
  var templates = file.expand(options.templates = options.templates || ['templates/*.hbs']);

  var pages = {},
    ext,
    pageObject,
    context,
    filename,
    i18NObject;

  var process = function (languages, i18n, unikeys) {

    _.each(templates, function (page) {

      ext = path.extname(page);
      pageObject = matter.read(page);

      _.each(languages, function (language) {

        i18NObject = {
          languages: languages
        };
        i18NObject[language] = i18n[language];
        _.assign(i18NObject, filterUnikeys(language, unikeys, i18n));

        context = _.assign({}, pageObject.context, {language: language, i18n: i18NObject})
        filename = page.replace(ext, "-" + language + ext);

        pages[filename] = {
          filename: filename,
          content: pageObject.content,
          data: context
        };

      });

      if (options.gc) {
        global.gc();
      }

    });
  };

  var filterUnikeys = function(languages, unikeys, i18n) {
    var collection = {};
    _.each(unikeys, function(unikey) {
      _.each(languages, function(language) {
        collection[language][unikey] = i18n[language][unikey];
      });
    });
    return collection;
  };

  // Expand given filepaths
  if (data) {

    var filepaths = file.expand(data),
      i18n = {},
      filedata,
      languageKey;

    _.each(filepaths, function (filepath, index) {

      // Read in the data from each file
      filedata = file.readDataSync(filepath);

      if (filedata.languages) {
        options.languages = _.union(filedata.languages || [], options.languages || []);
      } else {
        languageKey = path.basename(filepath, path.extname(filepath));
        i18n[languageKey] = filedata;
      }
    });
    process(options.languages, i18n, options.unikeys);
  } else {
    process(options.languages);
  }

  return pages;
}
