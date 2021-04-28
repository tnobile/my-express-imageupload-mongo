const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const express = require("express");
const app = express();

app.use(express.json());
app.set("view engine", "ejs");


require('dotenv').config();
// DB
const mongoURI = process.env.MONGO_URL;

// connection
const conn = mongoose.createConnection(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// init gfs
let gfs;
conn.once("open", () => {
    // init stream
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: "uploads"
    });
});


// Storage
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString("hex") + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: "uploads"
                };
                resolve(fileInfo);
            });
        });
    }
});

const upload = multer({ storage });


app.get("/buenas", (req, res) => res.send("buenas?"));
app.get("/empty", (req, res) => {
    res.render("index", { files: [] });
});

app.get("/", (req, res) => {
    if (!gfs) {
        console.log("some error occured, check connection to db");
        res.send("some error occured, check connection to db");
        process.exit(0);
    }
    gfs.find().toArray((err, files) => {
        // check if files
        if (!files || files.length === 0) {
            return res.render("index", {
                files: false
            });
        } else {
            const f = files
                .map(file => {
                    if (
                        file.contentType === "image/png" ||
                        file.contentType === "image/jpeg"
                    ) {
                        file.isImage = true;
                    } else {
                        file.isImage = false;
                    }
                    return file;
                })
                .sort((a, b) => {
                    return (
                        new Date(b["uploadDate"]).getTime() -
                        new Date(a["uploadDate"]).getTime()
                    );
                });

            return res.render("index", {
                files: f
            });
        }
    });
});

app.post("/upload", upload.single("file"), (req, res) => {
    res.redirect("/");
});

app.get("/image/:filename", (req, res) => {
    const file = gfs
        .find({
            filename: req.params.filename
        })
        .toArray((err, files) => {
            if (!files || files.length === 0) {
                return res.status(404).json({
                    err: "no files exist"
                });
            }
            gfs.openDownloadStreamByName(req.params.filename).pipe(res);
        });
});

app.post("/files/del/:id", (req, res) => {
    gfs.delete(new mongoose.Types.ObjectId(req.params.id), (err, data) => {
        if (err) return res.status(404).json({ err: err.message });
        res.redirect("/");
    });
});

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

const port = 5000;
app.listen(port, () => {
    console.log("server started on " + port);
});

///https://dev.to/shubhambattoo/uploading-files-to-mongodb-with-gridfs-and-multer-using-nodejs-5aed
///https://github.com/shubhambattoo/node-js-file-upload