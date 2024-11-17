const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware to parse URL-encoded data from forms
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Constant invite code
const INVITE_CODE = "Note Vote 2024";

// Route to render the login page
app.get("/", (req, res) => {
    res.render("login");
});

// Route to render the registration page
app.get("/register", (req, res) => {
    res.render("register");
});

// Login route
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Read users from users.json
    fs.readFile(path.join(__dirname, "models/users.json"), "utf8", (err, data) => {
        if (err) {
            console.error("Could not read users.json", err);
            return res.status(500).send("Server error.");
        }

        const users = JSON.parse(data);
        const user = users.find(user => user.username === username);

        // Check if username exists and password matches
        if (user && user.password === password) {
            // Redirect to /note-vote with username in the request body
            req.body.username = user.username;
            res.redirect(307, "/note-vote");
        } else {
            // Redirect back to login page with an error message (you could also render the error message directly)
            res.status(401).send("Invalid username or password.");
        }
    });
});

// Registration route
app.post("/register", (req, res) => {
    const { username, password, inviteCode } = req.body;

    // Check if the invite code matches
    if (inviteCode !== INVITE_CODE) {
        return res.status(400).send("Invalid invite code.");
    }

    // Read users from users.json
    fs.readFile(path.join(__dirname, "models/users.json"), "utf8", (err, data) => {
        if (err) {
            console.error("Could not read users.json", err);
            return res.status(500).send("Server error.");


        }

        const users = JSON.parse(data);

        // Check if the username already exists
        const userExists = users.some(user => user.username === username);
        if (userExists) {
            return res.status(400).send("Username already exists. Please choose a different username.");
        }

        // Create new user and add to users array
        const newUser = { username, password };
        users.push(newUser);

        // Save updated users list to users.json
        fs.writeFile(path.join(__dirname, "models/users.json"), JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error("Could not save new user to users.json", err);
                return res.status(500).send("Server error.");
            }

            // Redirect to /note-vote with the new user's username
            req.body.username = username;
            res.redirect(307, "/note-vote");
        });
    });
});

// Note-vote route
app.post("/note-vote", (req, res) => {
    const { username } = req.body;

    fs.readFile(path.join(__dirname, "models/posts.json"), "utf8", (err, data) => {
        if (err) {
            console.error("Could not read posts.json", err);
            return res.status(500).send("Server error.");
        }

        const posts = JSON.parse(data);
        res.render("note-vote", { username, posts });
    });
});

// Add post route
app.post("/addpost", (req, res) => {
    const { username, text } = req.body;

    fs.readFile(path.join(__dirname, "models/posts.json"), "utf8", (err, data) => {
        if (err) {
            console.error("Could not read posts.json", err);
            return res.status(500).send("Server error.");
        }

        const posts = JSON.parse(data);
        const newPost = {
            _id: Date.now(),
            text,
            creator: username,
            upvotes: [],
            downvotes: []
        };

        posts.push(newPost);

        fs.writeFile(path.join(__dirname, "models/posts.json"), JSON.stringify(posts, null, 2), (err) => {
            if (err) {
                console.error("Could not write to posts.json", err);
                return res.status(500).send("Server error.");
            }

            res.redirect(307, "/note-vote");
        });
    });
});
app.post("/upvote", (req, res) => {
    const { postId, username } = req.body;

    fs.readFile(path.join(__dirname, "models/posts.json"), "utf8", (err, data) => {
        if (err) {
            console.error("Could not read posts.json", err);
            return res.status(500).send("Server error.");
        }

        const posts = JSON.parse(data);
        const post = posts.find(p => p._id === parseInt(postId));

        if (post) {
            // If user has already downvoted, remove downvote and add upvote
            if (post.downvotes.includes(username)) {
                post.downvotes = post.downvotes.filter(user => user !== username);
            }

            // Add the upvote if not already added
            if (!post.upvotes.includes(username)) {
                post.upvotes.push(username);
            }

            fs.writeFile(path.join(__dirname, "models/posts.json"), JSON.stringify(posts, null, 2), (err) => {
                if (err) {
                    console.error("Could not write to posts.json", err);
                    return res.status(500).send("Server error.");
                }

                res.redirect(307, "/note-vote");
            });
        } else {
            res.status(404).send("Post not found.");
        }
    });
});


// Downvote route
app.post("/downvote", (req, res) => {
    const { postId, username } = req.body;

    fs.readFile(path.join(__dirname, "models/posts.json"), "utf8", (err, data) => {
        if (err) {
            console.error("Could not read posts.json", err);
            return res.status(500).send("Server error.");
        }

        const posts = JSON.parse(data);
        const post = posts.find(p => p._id === parseInt(postId));

        if (post) {
            // If user has already upvoted, remove upvote and add downvote
            if (post.upvotes.includes(username)) {
                post.upvotes = post.upvotes.filter(user => user !== username);
            }

            // Add the downvote if not already added
            if (!post.downvotes.includes(username)) {
                post.downvotes.push(username);
            }

            fs.writeFile(path.join(__dirname, "models/posts.json"), JSON.stringify(posts, null, 2), (err) => {
                if (err) {
                    console.error("Could not write to posts.json", err);
                    return res.status(500).send("Server error.");
                }

                res.redirect(307, "/note-vote");
            });
        } else {
            res.status(404).send("Post not found.");
        }
    });
});


// Logout route
app.get("/logout", (req, res) => {
    // If using sessions, you might clear the session here, e.g., req.session.destroy();
    res.redirect("/"); // Redirect to login page
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});