# messager-api


### Doppler
- `doppler login`
- `doppler setup -p heem -c prd`
- `doppler secrets download --no-file --format=env > .env`


### Setup
- `brew install ffmpeg`
- Get the secrets from doppler
- `npm run dev`



### seems legit
ffmpeg -i input_path.mp3 -c:a libopus -b:a 32k -vbr on -compression_level 10 -frame_duration 60 -application voip output_path.ogg


### Commands

start - Start receiving messages from Heem
location - Share your location with Heem
time - Pick a time for your daily notification
stop - Stop receiving messages
