# tokenr Border Format
Border images contain the border graphic stored on the left-half and an alpha mask on the right-half.

The token image will be draw atop any opaque or partially opaque parts of the mask, inheriting the alpha of those parts.

The output size of the token is determined by the size of the border image.

For example, if a 512x512 pixel token output is desired, the border image would be 1024x512 pixels, with the border overlay between 0x0 and 512x512 and the border alpha mask between 512x0 and 1024x512.
