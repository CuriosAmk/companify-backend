import express from "express";
import axios from "axios";
import querystring from "querystring";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Step 1: redirect user to Spotify login
app.get("/auth/login", (req, res) => {
  const scope = ["user-read-currently-playing", "user-read-playback-state"].join(" ");
  const state = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    state,
  });

  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Step 2: Spotify calls us back
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Redirect back into the app via deep link
    return res.redirect(`https://companify-backend-gslu.onrender.com/callback?access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (err) {
    console.error("Error exchanging code:", err.response?.data || err);
    return res.status(500).json({ error: "Failed to get tokens" });
  }
});

app.listen(PORT, () => console.log(`Spotify backend running on port ${PORT}`));
