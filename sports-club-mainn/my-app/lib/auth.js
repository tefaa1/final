
export function getUsers() {
  try {
    const raw = localStorage.getItem("users");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUser(user) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
}

export function findUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email === email);
}

export function setAuthToken(token) {
  localStorage.setItem("auth-token", token);
}

export function getAuthToken() {
  return localStorage.getItem("auth-token");
}

export function setCurrentUser(user) {
  localStorage.setItem("current-user", JSON.stringify(user));
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("current-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("auth-token");
  localStorage.removeItem("current-user");
}
