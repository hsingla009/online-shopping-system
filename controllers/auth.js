const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
// const sendgridTransport = require('nodemailer-sendgrid-transport');
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const sendGridApi = require("../ApiKeys");
sgMail.setApiKey(sendGridApi.SEND_GRID_API);

const { validationResult } = require("express-validator");
exports.getLogin = (req, res, next) => {
  // console.log("cookie");
  // const isLoggedIn = req.get('cookie').split(';')[2].trim().split('=')[1] === 'true';

  // console.log(req.session.isLoggedIn);
  let msg = req.flash("error");

  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  // console.log(msg);
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: msg,
    oldInput: {
      email: "",
      password: "",
    },
  });
};

exports.postLogin = (req, res, next) => {
  // res.setHeader('Set-cookie', 'loggedIn = true');
  const email = req.body.email;
  const password = req.body.password;
  //console.log(password);
  User.findOne({ email: email })

    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: "Invalid email or password",
          oldInput: {
            email: email,
            password: password,
          },
        });
      }
      bcrypt.compare(password, user.password).then((doMatch) => {
        if (!doMatch) {
          return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: "Invalid email or password",
            oldInput: {
              email: email,
              password: password,
            },
          });
        }
        req.session.user = user;
        req.session.isLoggedIn = true;
        //console.log(req.session);
        return req.session.save(() => {
          res.redirect("/");
        });
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postLogout = (req, res, next) => {
  // res.setHeader('Set-cookie', 'loggedIn = true');
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.getSignup = (req, res, next) => {
  let msg = req.flash("error");

  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: msg,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationErrors: [],
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  //  console.log(errors);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      },
      validationErrors: errors.array(),
    });
  }

  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      user = new User({
        email: email,
        password: hashPassword,
        cart: { items: [] },
      });
      return user
        .save()

        .then(() => {
          res.redirect("/login");
          const msg = {
            to: email,
            from: "harshitsingla3667@gmail.com",
            subject: "Signup Succeeded",
            html: "<h1>You Successfully signup</h1>",
          };
          return sgMail
            .send(msg)
            .then(() => {
              console.log("Email sent");
            })
            .catch((error) => {
              console.error(error);
            });
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.getReset = (req, res, next) => {
  let msg = req.flash("error");

  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset",
    errorMessage: msg,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) return res.redirect("/login");
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save().then(() => {
          res.redirect("/");
          const msg = {
            to: req.body.email,
            from: "harshitsingla3667@gmail.com",
            subject: "Reset Password",
            html: `<p>click this <a href="http://localhost:3000/reset/${token}">link</a> for reset the password`,
          };
          return sgMail
            .send(msg)
            .then(() => {
              console.log("Email sent");
            })
            .catch((error) => {
              console.dir(error,{depth:null});
            });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  let msg = req.flash("error");

  if (msg.length > 0) {
    msg = msg[0];
  } else {
    msg = null;
  }
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      // console.log(user);
      if (!user)
        return res
          .status(404)
          .render("404", { pageTitle: "Page Not Found", path: "/404" });

      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "Reset Password",
        userId: user._id,
        errorMessage: msg,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const password = req.body.newPassword;
  User.findById(req.body.userId).then((user) => {
    bcrypt
      .hash(password, 12)
      .then((hashPassword) => {
        user.password = hashPassword;
        return user.save().then(() => {
          res.redirect("/login");
          return transport
            .sendMail({
              to: user.email,
              from: "harshitsingla009@gmail.com",
              subject: "Password Changed Sucessfully",
              html: "<h1>Password Changed Sucessfully</h1>",
            })
            .catch((err) => {
              console.log(err);
            });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};
