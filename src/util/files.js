/**
 * Read a text file (e.g. .kdw file)
 * @param  {File} file DOM file (from input[type="filel"])
 * @return {Promise} resolves with text content
 */
export const readFile = file => new Promise(function(resolve) {
  const reader = new FileReader()
  reader.onload = function() {
    resolve(reader.result)
  }
  reader.readAsText(file)
})

/**
 * Take text and a filename and (hopefully) offer it as a download
 * to the user.
 * @param  {string} text  string to be downloaded as text file
 * @param  {string} filename
 */
export function saveTextAs(text, filename) {
  const blob = new Blob([text], {type: "text/plain;charset=utf-8"})
  const url = URL.createObjectURL(blob)

  const downloadLink = document.createElement('a')
  downloadLink.style.display = "none"
  downloadLink.setAttribute("href", url)
  downloadLink.setAttribute("download", filename)

  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)

  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000)
}
