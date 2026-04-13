const crypto = require("crypto");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createAppError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createAuthService({ userRepository, idGenerator }) {
  async function signup({ email, password, nickname }) {
    if (!email || !password || !nickname) {
      throw createAppError("email, password y nickname son obligatorios", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createAppError("Email inválido", 400);
    }

    if (password.length < 6) {
      throw createAppError("La contraseña debe tener al menos 6 caracteres", 400);
    }

    const normalizedNickname = nickname.trim().toLowerCase();
    if (normalizedNickname.length < 3) {
      throw createAppError("El nickname debe tener al menos 3 caracteres", 400);
    }

    const existingUser = await userRepository.findByEmailOrNickname(email, normalizedNickname);
    if (existingUser) {
      if (existingUser.email === email) {
        throw createAppError("El email ya está registrado", 409);
      }
      if (existingUser.username === normalizedNickname) {
        throw createAppError("El nickname ya está en uso", 409);
      }
    }

    const userId = idGenerator();
    const hashedPassword = hashPassword(password);

    await userRepository.createUser({
      id: userId,
      email,
      password: hashedPassword,
      username: normalizedNickname,
    });

    return {
      id: userId,
      email,
      nickname: normalizedNickname,
    };
  }

  async function login({ email, password }) {
    if (!email || !password) {
      throw createAppError("email y password son obligatorios", 400);
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw createAppError("Credenciales inválidas", 401);
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      throw createAppError("Credenciales inválidas", 401);
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.username,
    };
  }

  async function checkNicknameAvailable(nickname) {
    const normalizedNickname = nickname.trim().toLowerCase();
    const user = await userRepository.findByNickname(normalizedNickname);
    return !user;
  }

  return {
    signup,
    login,
    checkNicknameAvailable,
  };
}

module.exports = {
  createAuthService,
};
