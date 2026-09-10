// File: validate-login.ts
// Checks Gmail format and matches email / password against local users.json.

import { AuthUser } from "./AuthContext";
import usersFile from "./users.json";

export type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const GMAIL = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedEmail) {
    errors.email = "Enter your Gmail address.";
  } else if (!GMAIL.test(trimmedEmail)) {
    errors.email = "Use a valid Gmail address (example@gmail.com).";
  }

  if (!trimmedPassword) {
    errors.password = "Enter your password.";
  } else if (trimmedPassword.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (errors.email || errors.password) {
    return errors;
  }

  if (!findUser(trimmedEmail, trimmedPassword)) {
    errors.form = "Gmail or password is incorrect.";
  }

  return errors;
}

export function findUser(email: string, password: string): AuthUser | null {
  const match = usersFile.users.find(
    (user) =>
      normalize(user.email) === normalize(email) &&
      user.password === password,
  );
  if (!match) {
    return null;
  }
  return { name: match.name, email: match.email };
}

export function canSubmitLogin(email: string, password: string) {
  return email.trim().length > 0 && password.trim().length > 0;
}
