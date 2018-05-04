import {translate as t} from "../localization";

/**
 * Read a text file (e.g. .kdw file)
 * @param  {File} file DOM file (from input[type="filel"])
 * @return {Promise} resolves with text content
 */
export const readFile = file => new Promise(function(resolve) {
  const reader = new FileReader();
  reader.onload = function() {
    resolve(reader.result);
  };
  reader.readAsText(file);
});

/**
 * Take text and a filename and (hopefully) offer it as a download
 * to the user.
 * @param  {string} text  string to be downloaded as text file
 * @param  {string} filename
 */
export const saveTextAs = (function() {
  const downloadLink = document.createElement('a');

  // feature detection
  if ("download" in downloadLink) {
    downloadLink.style.display = "none";
    return function download(text, filename) {
      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      const url = URL.createObjectURL(blob);

      downloadLink.setAttribute("href", url);
      downloadLink.setAttribute("download", filename);

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    };

  // maybe old IE?
  } else if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
    return function oldIEDownload(text, filename) {
      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      navigator.msSaveOrOpenBlob(blob, filename);
    };

  } else {
    alert(t("error.browser_feature_not_available"));
  }
})();