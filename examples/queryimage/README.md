# Query Image
Some models support vision others not.
Models with vision support can answer questions about the image, but once questions answered all subsequent llm calls's tokens would be wasted on the image that you do not need anymore. 

For this reason it might be convinient to have a separate tool that answers question about an image
`queryimage.tool.chat`
```chat
system: @mistral-small-latest
You help answer questions about an image

user: @{ filename | resolve }
@query
```
Because filename contains path to image we need a special 
`resolve` processor to transform the filename to image node

## how to use

```chat
system: @queryimage

user: 
what is on image.jpg?

tool_call: queryimage {"filename":"image.jpg"}
What is in this image?

tool_result: 
This image is a black-and-white illustration depicting two children playing outdoors. The child on the left is a boy wearing a sleeveless shirt and shorts, and he appears to be running. The child on the right is a girl with her hair tied back in a ponytail, wearing a dress with vertical stripes and a bow at the neck. She is also in motion, seemingly chasing or playing with the boy. Both children are barefoot and are running on a grassy area with small plants or grass tufts visible at the bottom of the image. The overall scene conveys a sense of playfulness and childhood joy.
```
