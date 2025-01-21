This is a simple HTML/JS/CSS page that I built to illustrate (and work through) why and how exactly the precense of emoji can cause differences in the character length of computed and rendered references of the same input string in After Effect's text layers.

View the demo live at [ae-emoji.phordan.com]

## The problem was simple:

In JavaScript, strings can also be represented as arrays, a 'list', where each character is an entry.   

`.length()` will tell us how many characters the string is, etc. 
```
function strToArray(str) {...};

strToArray("hello")  //>>>  ['h', 'e', 'l', 'l', 'o']
"hello".length()     //>>>  5
```

Emoji actually usually contain multiple characters, but all the things we render text with know to "smoosh em together" because there are special characters in that sequence indicate this.  

Turning a string with emoji into an array will show you the extra characters making up a full emoji. Some have more, some less.   

After Effect's text renderer doesn't support emoji, but still knows to "simplify" them because the instructions are part of unicode, which it still supports (I think).  

It doesn't preserve the hidden characters in it's data. When reading the layer's `sourceText`, an emoji will only be 1 character.  

If I use text selectors, the index being used will be the index of the *rendered* string.  

So if I use an expression to find "matches" in the string with regex it will use the *source string data with extra emoji utility characters* to find the match, but then it will affect an index in the rendered string *that doesn't have extra characters*.  

This will throw our matches off, and since emoji can have varying amounts of extra characters, it isn't simple to solve. You have to fully parse the 2 string-length types (which I did here).

## Why did I do this?
This problem came up because we were making social media gfx for a Netflix show and I wanted to proceduralize the twitter UI, and wanted to highlight hashtags automatically in my template. Emoji got in the way. 
