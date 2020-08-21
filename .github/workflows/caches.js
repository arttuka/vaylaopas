module.exports = {
  npm: {
    path: [`${process.env.HOME}/.npm`],
    hashFiles: [
      `package-lock.json`,
      `*/*/package-lock.json`,
      `!node_modules/*/package-lock.json`,
    ],
  }
}
