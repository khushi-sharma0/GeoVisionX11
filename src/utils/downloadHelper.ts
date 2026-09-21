/**
 * Universal file download utility that safely appends temporary anchor elements
 * to the DOM to guarantee execution across modern browsers, iframes, and sandboxes.
 */
export function triggerFileDownload(data: Blob | string, filename: string, mimeType?: string): void {
  let url: string;
  let shouldRevoke = false;

  if (typeof data === 'string' && (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('data:'))) {
    url = data;
  } else if (typeof data === 'string') {
    const blob = new Blob([data], { type: mimeType || 'text/plain;charset=utf-8' });
    url = URL.createObjectURL(blob);
    shouldRevoke = true;
  } else {
    url = URL.createObjectURL(data);
    shouldRevoke = true;
  }

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);

  try {
    link.click();
  } catch (err) {
    console.warn('Standard download click triggered, fallback:', err);
  } finally {
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
    }, 200);
  }
}
