const express = require("express");
const bodyParser = require("body-parser");
const authenticate = require("../auth");
const cors = require("./CORS");
const Comments = require("../model/comments");

const commentRouter = express.Router();

commentRouter.use(bodyParser.json());

commentRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Comments.find(req.query)
      .populate("author")
      .then(
        (comments) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(comments);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.veirfyUser, (req, res, next) => {
    // add comment
    if (req.body != null) {
      req.body.author = req.user._id;
      Comments.create(req.body)
        .then(
          (comment) => {
            Comments.findById(comment._id)
              .populate("author")
              .then((comment) => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(comment);
              });
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    } else {
      err = new Error("Comment not found in request body");
      err.status = 404;
      return next(err);
    }
  })
  .put(cors.corsWithOptions, authenticate.veirfyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /comments/");
  })
  .delete(
    cors.corsWithOptions,
    authenticate.veirfyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Comments.remove({})
        .then(
          (resp) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(resp);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  );

commentRouter
  .route("/:commentId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Comments.findById(req.params.commentId)
      .populate("author")
      .then(
        (comment) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(comment);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.veirfyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      "POST operation not supported on /comments/" + req.params.commentId
    );
  })
  .put(cors.corsWithOptions, authenticate.veirfyUser, (req, res, next) => {
    Comments.findById(req.params.commentId)
      .then(
        (comment) => {
          if (comment != null) {
            if (!comment.author.equals(req.user._id)) {
              var err = new Error(
                "You are not authorized to update this comment!"
              );
              err.status = 403;
              return next(err);
            }
            req.body.author = req.user._id;
            Comments.findByIdAndUpdate(
              req.params.commentId,
              {
                $set: req.body,
              },
              { new: true }
            ).then(
              (comment) => {
                Comments.findById(comment._id)
                  .populate("author")
                  .then((comment) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(comment);
                  });
              },
              (err) => next(err)
            );
          } else {
            err = new Error("Comment " + req.params.commentId + " not found");
            err.status = 404;
            return next(err);
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.veirfyUser, (req, res, next) => {
    Comments.findById(req.params.commentId)
      .then(
        (comment) => {
          if (comment != null) {
            if (!comment.author.equals(req.user._id)) {
              var err = new Error(
                "You are not authorized to delete this comment!"
              );
              err.status = 403;
              return next(err);
            }
            Comments.findByIdAndRemove(req.params.commentId)
              .then(
                (resp) => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(resp);
                },
                (err) => next(err)
              )
              .catch((err) => next(err));
          } else {
            err = new Error("Comment " + req.params.commentId + " not found");
            err.status = 404;
            return next(err);
          }
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

module.exports = commentRouter;
/* 
{
  "_id": "5f4e430ceec20757258bd68b",
  "rating": 5,
  "comment": "Imagine all the eatables, living in conFusion!",
  "author": "John Lemon",
  "dishId":"5f4e430ceec20757258bd68a"
  "createdAt": "2020-09-01T12:48:12.311Z",
  "updatedAt": "2020-09-01T12:48:12.311Z"
}
*/
// ------------------------------------------------------ comments -------------------------------------------------------
// dishRouter
//   .route("/:dishId/comments")
//   .options(corsWithOptions, (req, res) => {
//     res.sendStatus(200);
//   })
//   .get(cors, (req, res, next) => {
//     //get all comments
//     Dishes.findById(req.params.dishId)
//       .populate("comments.author")
//       .then(
//         (dish) => {
//           if (dish != null) {
//             res.statusCode = 200;
//             res.setHeader("Content-Type", "application/json");
//             res.json(dish.comments);
//           } else {
//             let err = new Error(`Dish ${req.params.dishId} not Found`);
//             err.status = 404;
//             return next(err);
//           }
//         },
//         (err) => next(err)
//       )
//       .catch((err) => next(err));
//   })
//   .post(corsWithOptions, veirfyUser, (req, res, next) => {
//     // add comment to dish
//     Dishes.findById(req.params.dishId)
//       .then((dish) => {
//         if (dish != null) {
//           req.body.author = req.user._id;
//           dish.comments.push(req.body);
//           dish.save().then(
//             (dish) => {
//               Dishes.findById(dish._id)
//                 .populate("comments.author")
//                 .then((dish) => {
//                   res.statusCode = 200;
//                   res.setHeader("Content-Type", "application/json");
//                   res.json(dish.comments);
//                 });
//             },
//             (err) => console.log(err)
//           );
//         } else {
//           let err = new Error(`Dish ${req.params.dishId} not Found`);
//           err.status = 404;
//           return next(err);
//         }
//       })
//       .catch((err) => next(err));
//   })
//   .put(corsWithOptions, veirfyUser, (req, res, next) => {
//     // forbeden to for comments
//     res.statusCode = 403;
//     res.end(
//       "PUT operation not supported on /dishes" + req.params.dishId + "/comments"
//     );
//   })
//   .delete(corsWithOptions, veirfyUser, verifyAdmin, (req, res, next) => {
//     // delet all the comments
//     Dishes.findById(req.params.dishId)
//       .then((dish) => {
//         if (dish != null) {
//           if (dish != null) {
//             for (var i = dish.comments.length - 1; i >= 0; i--) {
//               dish.comments.id(dish.comments[i]._id).remove();
//               dish.save().then((dish) => {
//                 res.statusCode = 200;
//                 res.setHeader("Content-Type", "application/json");
//                 res.json(dish.comments);
//               });
//             }
//           } else {
//             let err = new Error(`Dish ${req.params.dishId} not Found`);
//             err.status = 404;
//             return next(err);
//           }
//         }
//       })
//       .catch((err) => next(err));
//   });

// dishRouter
//   .route("/:dishId/comments/:commentId")
//   .options(corsWithOptions, (req, res) => {
//     res.sendStatus(200);
//   })
//   .get(cors, (req, res, next) => {
//     // get comment
//     Dishes.findById(req.params.dishId)
//       .populate("comments.author")
//       .then((dish) => {
//         if (dish != null && dish.comments.id(req.params.commentId) != null) {
//           dish.comments.push(req.body);
//           dish.save().then((dish) => {
//             res.statusCode = 200;
//             res.setHeader("Content-Type", "application/json");
//             res.json(dish.comments.id(req.params.commentId));
//           });
//         } else if (dish == null) {
//           let err = new Error(`dish ${req.params.dishId} not Found`);
//           err.status = 404;
//           return next(err);
//         } else {
//           let err = new Error(`Comment ${req.params.commentId} not Found`);
//           err.status = 404;
//           return next(err);
//         }
//       })
//       .catch((err) => next(err));
//   })
//   .post(corsWithOptions, veirfyUser, (req, res, next) => {
//     // forbedin
//     res.statusCode = 403;
//     res.end(
//       "POST operation not supported on /dishes/" +
//         req.params.dishId +
//         "/comments" +
//         req.params.commentId
//     );
//   })
//   .put(corsWithOptions, veirfyUser, (req, res, next) => {
//     /**
//      * update comment
//      */
//     Dishes.findById(req.params.dishId)
//       .then((dish) => {
//         if (
//           dish != null &&
//           dish.comments.id(req.params.commentId) != null &&
//           req.user._id == dish.comments.id(req.params.commentId).author._id
//         ) {
//           if (req.body.rating) {
//             dish.comments.id(req.params.commentId).rating = req.body.rating;
//           }
//           if (req.body.comment) {
//             dish.comments.id(req.params.commentId).comment = req.body.comment;
//           }
//           dish.save().then((dish) => {
//             Dishes.findById(dish._id)
//               .populate("comments.author")
//               .then((params) => {
//                 res.statusCode = 200;
//                 res.setHeader("Content-Type", "application/json");
//                 res.json(dish.comments.id(req.params.commentId));
//               });
//           });
//         } else if (dish == null) {
//           let err = new Error(`dish ${req.params.dishId} not Found`);
//           err.status = 404;
//           return next(err);
//         } else if (
//           req.user._id !== dish.comments.id(req.params.commentId).author._id
//         ) {
//           let err = new Error(`Only the comment auther can modify the comment`);
//           err.status = 403;
//           return next(err);
//         } else {
//           let err = new Error(`Comment ${req.params.commentId} not Found`);
//           err.status = 404;
//           return next(err);
//         }
//       })
//       .catch((err) => next(err));
//   })
//   .delete(corsWithOptions, veirfyUser, (req, res, next) => {
//     Dishes.findById(req.params.dishId)
//       .then(
//         (dish) => {
//           if (
//             dish != null &&
//             dish.comments.id(req.params.commentId) != null &&
//             req.user._id == dish.comments.id(req.params.commentId).author._id
//           ) {
//             dish.comments.id(req.params.commentId).remove();
//             dish.save().then(
//               (dish) => {
//                 Dishes.findById(dish._id)
//                   .populate("comments.author")
//                   .then((dish) => {
//                     res.statusCode = 200;
//                     res.setHeader("Content-Type", "application/json");
//                     res.json(dish);
//                   });
//               },
//               (err) => next(err)
//             );
//           } else if (dish == null) {
//             let err = new Error("Dish " + req.params.dishId + " not found");
//             err.status = 404;
//             return next(err);
//           } else {
//             let err = new Error(
//               "Comment " + req.params.commentId + " not found"
//             );
//             err.status = 404;
//             return next(err);
//           }
//         },
//         (err) => next(err)
//       )
//       .catch((err) => next(err));
//   });
