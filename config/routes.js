const axios = require("axios");
const knex = require("knex");
const bcrypt = require("bcryptjs");
const dbConfig = require("../knexfile");
const jwt = require("jsonwebtoken");

const jwtKey = require("../_secrets/keys").jwtKey;
const { authenticate } = require("./middlewares");
const db = knex(dbConfig.development);

module.exports = server => {
  server.get("/api/users", getUsers);
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

function getUsers(req, res) {
  db("users")
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      console.error(err);
    });
}

function register(req, res) {
  let user = req.body;
  user.password = bcrypt.hashSync(user.password, 12);

  db("users")
    .insert(user)
    .then(ids => {
      id = ids[0];

      db("users")
        .where({ id: id })
        .first()
        .then(user => {
          const token = generateToken(user);
          res.status(201).json({ id: user.id, token });
        })
        .catch(err => {
          res.status(500).send(err);
        });
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

function login(req, res) {
  const creds = req.body;

  db("users")
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = generateToken(user);

        res.status(200).json({ token });
      } else {
        res.status(401).json({ message: "You shall not pass!" });
      }
    })
    .catch(err => res.status(500).send(err));
}

function getJokes(req, res) {
  axios
    .get(
      "https://08ad1pao69.execute-api.us-east-1.amazonaws.com/dev/random_ten"
    )
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}

function generateToken(user) {
  const payload = {
    username: user.username,
    department: user.department
  };

  const options = {
    expiresIn: "1hr",
    jwtid: "12345"
  };

  return jwt.sign(payload, jwtKey, options);
}
