# PageStack

## Description
An animated library based on the cards shuffle concept to make websites/apps or simply presentations like powerpoint.

## Prerequisites
It doesn't have prerequisites.

## Installation
### Global
There's a global version, you just need to include the global file with a ```<script/>``` tag:
```
<script src="pagestack.global.js"/>
```

### ESM
There's an ESM version, you just need to import the needed feature:
```
// Importing all functions as set.
import * as pagestack from 'pagestack.esm.js'

// Importing individually.
import { defineConfig } from 'pagestack.esm.js'
```

### Vue
There's a Vue version, and to install it you just need to run in CMD:
```
npm i @angsdev/vue-pagestack
```
Then, import the ```createPageStack``` method and you will pass an object with the config:
```
import { createPageStack } from ' @angsdev/vue-pagestack';
export default createPageStack(...configObject);
```
Finally, use the plugin in your vue instantiation:
```
import { createApp } from 'vue';
import PS from 'pagestack';

const app = createApp(App);
app.use(PS)
   .mount('#app');
```

## Setup
To define the library functionality you can stablish custom options or use the default.
You have to pass an object to methods
```defineConfig``` in case you'are using ESM (also available in Vue),
```createPageStack``` in case you're using Vue or global ```pagestack```:
```
// ESM version
defineConfig(...configObject);

// Global version
pagestack(...configObject); or window.pagestack(...configObject);
// or if you want to change later
pagestack.defineConfig(...configObject);

// Vue version
createPageStack(...configObject);
// or already within vue app but it's recommended the previous
this.$pagestak.defineConfig(...configObject);
```
### Notice:
In any case, you must link manually the library styles because it provide both css and scss, to you choose your preferred one.
<br/>
In case you use scss, you can modify it class names to keep a semantic sense with your decided customized id|class name but it's NOT RECOMMENDED, so do it under your responsibility.

### The config object can contain the following options:

- Property: ```container```
  - Type: string
  - Default: ```#ps-pages```
  - Description: The container or stack id|class of all pages.

- Property: ```pageSelector```
  - Type: string
  - Default: ```.ps-page```
  - Description: The id|class of each pages from the stack.

- Property: ```direction```
  - Type: string
  - Default: ```up```
  - Description: The direction where each page will slide.
    Possible values:
    - To slide up: ```up```, ```top```, ```vertical```
    - To slide right: ```right```, ```horizontal```
    - To slide down: ```down```, ```bottom```, ```vertical-inverted```
    - To slide left: ```left```, ```horizontal-inverted```

- Property: ```scrollingSpeed```
  - Type: number
  - Default: ```700```
  - Description: The speed of scrolling.


- Property: ```hashHistorial```
  - Type: boolean
  - Default: ```false```
  - Description: An option which allow manages pages changing depending on url hash.

- Property: ```menu```
  - Type: string|null
  - Default: ```null```
  - Description: The id|class of a menu to handle when the navigation change.

- Property: ```anchors```
  - Type: string[]
  - Default: ```[]```
  - Description: An array of ids to move through the pages.

- Property: ```loopTop```
  - Type: boolean
  - Default: ```false```
  - Description: Specify if when it reach the last page scrolling down returns to the first one.

- Property: ```loopBottom```
  - Type: boolean
  - Default: ```false```
  - Description: Specify if when it reach the first page scrolling up returns to the last one.

- Property: ```keyboardScrolling```
  - Type: boolean
  - Default: ```false```
  - Description: Specify if the pages are changeable with the keyboard.


- Property: ```beforeChange```
  - Type: function
  - Default: ```null```
  - Description: A function to execute some instruction just before the page change.

- Property: ```afterChange```
  - Type: function
  - Default: ```null```
  - Description: A function to execute some instruction just after the page change.

- Property: ```navigation```
  - Type: object
  - Properties:
    - Property: ```container```
      - Type: string
      - Default: ```#ps-nav```
      - Description: The container id|class of the navigation bar.

    - Property: ```dynamic```
      - Type: boolean
      - Default: ```false```
      - Description: Establish if the pages navigation bar will be created dynamically.
    
    - Property: ```position```
      - Type: string
      - Default: ```right```
      - Description: The position where will be positioned the pages navigation bar. Note: It only works if the dynamic is ```true```.
        Possible values:
        - Positioning up: ```up``` and ```top```
        - Positioning right: ```right```
        - Positioning down: ```down``` and ```bottom```
        - Positioning left: ```left```

    - Property: ```class```
      - Type: string[]
      - Default: ```[]```
      - Description: Array of classes to add to the navigation bar container. Note: It only works if the dynamic is ```true```.

    - Property: ```tooltips```
      - Type: string
      - Default: ```[]```
      - Description: Array of tooltips to add to each navigation bar item. Note: It only works if the dynamic is ```true```.

### Snippets
Above will be some examples on how to build each necessaty part of the library to work:

  - Pages stack:
    ```
    // Pages stack container
    <article id="ps-pages">

      // Each Page
      <article id="page1" class="ps-page ps-scrollable">
        // ...Rest of content
      </article>
    </article>
    ```

  - Pages navegation:
    ```
    <ul id="ps-nav" class="right">
      <li><a href="#page1"><span></span></a></li>
      <li><a href="#page2"><span></span></a></li>
      <li><a href="#page3"><span></span></a></li>
      <li><a href="#page4"><span></span></a></li>
    </ul>
    ```

But if you're using ```vue-pagestack``` there are some components:

  - Component: ```ps-container```
    - Description: Contain the pages stack container and give you a slot to put inside different pages.
    - Attributes: 
      - id: The indentifier of the pages stack.
      - class: The desired classes to add to the pages stack.

  - Component: ```ps-page```
    - Description: Contain all the content of a single page and give you a slot to put inside different content.
    - Attributes: 
      - id: The indentifier of the page.
      - scrollable: A boolean attribute to specify if the page is scrollable.

  - Component: ```ps-nav```
    - Description: Pages navigation bar.
    - Attributes: 
      - id: The indentifier of the page.
      - position: The desired position of the navigation bar.

  - Component: ```ps-nav-item```
    - Description: Pages navigation bar item.
    - Attributes:
      - anchor: The anchor which will be binded with each page.

## Donations
If you have enjoyed using this library and you can and want to support it
you can do it in the following buttons.

<a href="https://www.paypal.com/paypalme/AngelQuinonezS"><img src="./src/img/paypal-donate-button.png" alt="Donations" width="250" height="100"></a>

## License
Copyright 2022 - Angel Quiñonez

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
