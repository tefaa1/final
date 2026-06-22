export const parseError = async (res) => {
  let message = "Something went wrong";

  try {
    const data = await res.json();
    message = data.message || data.error || message;
  } catch {
    message = await res.text();
  }

  return message;
};