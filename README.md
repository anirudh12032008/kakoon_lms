# Kokoon Editor

this is a interactive editor to create complex hardware project with a simple drag and drop mechanism, and easy connectors.
you just need to drag and drop the nodes from the sidebar and connect it according to the logic, doing so would generate a python code which you can flash in your esp32 with a single click without any hassle or worrying about errors

there is also a option to write custom code if you wish to do any changes to it you can do it in the code editor 
with the help of hardware view you can drag and drop direct electronic components in the canvas and connect them visually


## features

### designer panel
ever wanted to create oled animation but couldn't figure out how to do that? no need to worry you can simply draw whatever you want pixel by pixel and with a single click you can add it to your project
similarly you can do this with leds and matrixes to create really really cool projects which are engaging 

### side bar
use this to find all the avilable nodes available in the project

### node editor 
drag nodes from the sidebar, connect them and the python code is generated live automatically

### hardware view
place components like lefs sensors and displays on the canvas and wire them to your esp32 visually



## tech stack
frontend
- react 
- tailwind
- esptool-js
- redux
- framer motion


backend
- node + express
- mongodb
- jwt auth
- redis
- helmet

## screenshots

## how it was made
wanted to fix the never ending issue of asking claude/gpt to write code for my hardware and the annoying bugs and the very long runtime so i thought why not create something on my own and actually use it!!


## running it locally
use node js latest version and clone the repo and install dependency and make sure u have all the env setup then use it with pnpm dev

### ai usage
Ai was used to reduce the repetitive tasks and do the boring work, the main conceptual work and the directions were provided by me. the hardware testing part took alot of time still and i made sure this isn't just a AI slop but a actually usefull tool!