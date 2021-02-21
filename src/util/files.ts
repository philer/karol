/** Read a text file (e.g. .kdw file) */
export const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => resolve(reader.result as string))
    reader.addEventListener("error", () => reject(reader.error))
    reader.readAsText(file)
  })

/**
 * Take text and a filename and (hopefully) offer it as a download
 * to the user.
 */
export function saveTextAs(text:string, filename:string) {
  const blob = new Blob([text], {type: "text/plain;charset=utf-8"})
  const url = URL.createObjectURL(blob)

  const downloadLink = document.createElement("a")
  downloadLink.style.display = "none"
  downloadLink.setAttribute("href", url)
  downloadLink.setAttribute("download", filename)

  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)

  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000)
}
