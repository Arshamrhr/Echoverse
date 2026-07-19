import os
import redis
from flask import Flask, jsonify

app = Flask(__name__)
cache = redis.Redis(host=os.environ.get('REDIS_HOST', 'redis'), port=6379)

@app.route('/api/anime')
def get_anime():
    anime_list = [
        {"title": "Attack on Titan", "genre": "Action/Drama"},
        {"title": "Death Note", "genre": "Psychological Thriller"},
        {"title": "Demon Slayer", "genre": "Action/Fantasy"}
    ]
    return jsonify(anime_list)

@app.route('/api/music')
def get_music():
    return jsonify({"track": "Epic OST Mix", "url": "/media/music/track1.mp3"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
