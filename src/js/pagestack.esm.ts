'use strict';

/*-------------------------------------------------------------------------------
  Local scope general vars.
-------------------------------------------------------------------------------*/

interface ExecutingOptions {
  container?: string,
  pageSelector?: string,
  direction?: string,
  menu?:  null|string,
  anchors?: string[],
  scrollingSpeed?: number,
  touchSensitivity?: number,
  loopBottom?: boolean,
  loopTop?: boolean,
  keyboardScrolling?: boolean,
  hashHistorial?: boolean,

  // Navigation
  navigation?: {
    dynamic: boolean,
    container: string,
    position: string,
    class: string[],
    tooltips: string[]
  }

  // hooks
  beforeSlide?: null|((proc: MovementProcess) => {}),
  afterSlide?: null|((proc: MovementProcess) => {})
}

interface TouchCoordinates {
  x?: number,
  y?: number
}

interface CompleteTouchCoordinates {
  touchStartX: number,
  touchStartY: number,
  touchEndX: number,
  touchEndY: number
  [index: string]: number|undefined
}

interface MovementProcess {
  activePage?: HTMLElement,
  activePageIndex: number,
  destinyPage: HTMLElement,
  destinyPageIndex?: number,
  destinyAnchor: string,
  movementDirection: string,
  pagesToMove?: HTMLElement[],
  translationClass?: string,
  animatePage?: HTMLElement
}

interface Pointer {
  down: 'pointerdown'|'MSPointerDown',
  move: 'pointermove'|'MSPointerMove',
  up: 'pointerup'|'MSPointerUp'
}

interface DynamicPropertyChoosing {
  [index: string]: any
}


/**
 * Defines the delay to take place before being able to scroll to the next section
 * BE CAREFUL! Not recommened to change it under 400 for a good behavior in laptops and
 * Apple devices (laptops, mouses...)
 **/
const scrollDelay: number = 1500;
// Default options, extended with any options that were provided.
const options: ExecutingOptions = {
  container: '#ps-pages',
  pageSelector: '.ps-page',
  direction: 'vertical',
  menu: null,
  anchors: [],
  scrollingSpeed: 700,
  touchSensitivity: 5,
  loopBottom: false,
  loopTop: false,
  keyboardScrolling: true,
  hashHistorial: false,
  // hooks
  beforeSlide: null,
  afterSlide: null
};
const isTouch: boolean|number = ('ontouchstart' in window) || ('msMaxTouchPoints' in navigator) || (navigator.maxTouchPoints);
const coord: CompleteTouchCoordinates = { touchStartY: 0, touchStartX: 0, touchEndY: 0, touchEndX: 0 };
let scrollings: number[] = [],
    lastAnimation: number = 0,
    lastScrolledDestiny: string,
    prevTime: number = new Date().getTime();

// Element containers
let $container: HTMLElement & DynamicPropertyChoosing,
    $pages: HTMLElement[],
    $firstPage: HTMLElement,
    $lastPage: HTMLElement,
    $navbar: HTMLElement|null,
    $listItems: HTMLElement[],
    $navAnchors: (HTMLAnchorElement|null)[];

/*-------------------------------------------------------------------------------
  Accesible methods
-------------------------------------------------------------------------------*/

/**
 * Combine the default options with the given and locate the main elements.
 * @param {object} customOptions
 * @returns {void}
 */
const defineConfig = (customOptions: ExecutingOptions): void => {

  // Default options, extended with any options that were provided.
  Object.assign(options, customOptions);
  options.navigation = Object.assign({
    dynamic: false,
    position: 'right',
    container: '#ps-nav',
    class: [],
    tooltips: []
  }, customOptions.navigation);
};

/**
 * Adds or remove the possiblity of scrolling through sections by using the mouse wheel/trackpad or touch gestures.
 * @param {boolean} value
 * @returns {void}
 */
const setAllowScrolling = (value: boolean): void => {

  setMouseWheelScrolling(value);
  (value) ? addTouchHandler() : removeTouchHandler();
};

/**
 * Defines the scrolling speed.
 * @param {number} value
 * @returns {number}
 */
const setScrollingSpeed = (value: number): number => (options.scrollingSpeed = value);

/**
 * Adds or remove the possiblity of scrolling through sections by using the keyboard arrow keys
 * @param {boolean} value
 * @returns {boolean}
 */
const setKeyboardScrolling = (value: boolean): boolean => (options.keyboardScrolling = value);

/**
 * Adds or remove the possiblity of scrolling through sections by using the mouse wheel or the trackpad.
 * @param {boolean} value
 * @returns {void}
 */
const setMouseWheelScrolling = (value: boolean): void => ((value) ? addMouseWheelHandler() : removeMouseWheelHandler());

/**
 * Moves to the previous page.
 * @returns {void}
 */
const moveToPrevPage = (): void => {

  const $active = $pages.find(el => el.classList.contains('active')) as HTMLElement;
  let $prev = $pages[$pages.indexOf($active) - 1];
  // If there's no more pages above and loopTop option is enabled then looping to the bottom
  if(!$prev && options.loopTop) $prev = $lastPage;
  if($prev) scrollPage($prev);
};

/**
 * Moves to the next page.
 * @returns {void}
 */
const moveToNextPage = (): void => {

  const $active = $pages.find(el => el.classList.contains('active')) as HTMLElement;
  let $next = $pages[$pages.indexOf($active) + 1];
  // If there's no more pages below and loopTop option is enabled then looping to the top
  if(!$next && options.loopBottom) $next = $firstPage;
  if($next) scrollPage($next);
};

/**
 * Moves the site to the given index or element.
 * @param {HTMLElement|number} page
 * @returns {void}
 */
const moveTo = (page: number|HTMLElement): void => {

  const destiny = (typeof(page) != 'number') ? page : $pages[page - 1];
  if(destiny) scrollPage(destiny);
};

/**
 * Initialization.
 * @returns {void}
 */
const init = (): void => {

  // Main containers
  $container = document.querySelector(options.container!) as HTMLElement;
  $pages = Array.from($container!.querySelectorAll(options.pageSelector!));
  $firstPage = $pages[0];
  $lastPage = $pages[$pages.length - 1];
  // Nav containers
  $navbar = document.querySelector(options.navigation!.container);
  $listItems = Array.from($navbar!.querySelectorAll('li, [anchor]'));
  $navAnchors = $listItems.map(el => el.querySelector('a'));

  /**
   * Giving respective index and positioning on active page if there's one, if not the first one.
   */
  new Promise<void>(resolve => {

    const $active = $pages.find(subEl => subEl.classList.contains('active'));
    for(let i = 0, zIndex = $pages.length, length = $pages.length; i < length; i++, zIndex--){

      const $el = $pages[i];
      $el.style.zIndex = zIndex.toString();
      // If there's no active page, the 1st one will be the default one
      if(!i && !$active) $el.classList.add('active');
    }
    return resolve();
  }).then(() => {

    if($navbar){

      const $activePageIndex: number = $pages.findIndex(el => el.classList.contains('active'));
      $listItems[$activePageIndex].querySelector('a')!.classList.add('active');
    }
  }).catch(console.error);

  /**
   * Initialize the scrolling
   */
  setAllowScrolling(true);

  /**
   * If when the window loads, it exists a anchor on the url hash and it matches with any page one it will scroll there.
   * Detecting any change on the URL to scroll to the given anchor link (a way to detect back history button as we play with the hashes on the URL).
   */
  if(options.hashHistorial){

    window.addEventListener('load', () => scrollToAnchor());
    window.addEventListener('hashchange', hashChangeHandler);
  }

  /**
   * Only if navigation dynamic property is setted to true the navigation bar will be created.
   */
  if(options.navigation?.dynamic) addNavigationBar();

  /**
   * Sliding with arrow keys, both, vertical and horizontal.
   */
  if(options.keyboardScrolling) keyboardNavigation();

  /**
   * Scrolls to the section when clicking the navigation bullet.
   */
  document.addEventListener('click', delegatedClickEvents);
  document.addEventListener('touchstart', delegatedClickEvents);
};

/**
  * Click and touch delegated events.
  * @returns {void}
  */
const delegatedClickEvents = (evt: MouseEvent|PointerEvent|TouchEvent): void => {

  const $el = evt.target as HTMLElement;

  const $anchorClose = $el.closest(`${options.navigation?.container} li,
                                    ${options.navigation?.container} [anchor]`);

  if($anchorClose){
    evt.preventDefault();
    evt.stopPropagation();

    const $li = $anchorClose as HTMLElement;
    const index = Array.from($li.parentElement!.children).findIndex(li => (li === $li));
    scrollPage($pages[index]);
  }

  if(options.menu && $el.matches(`${options.menu} [data-anchor]`) || $el.closest(`${options.menu} [data-anchor]`)){
    evt.preventDefault();
    evt.stopPropagation();

    const $anchor = ($el.closest('[data-anchor]') as HTMLElement)?.dataset['anchor'];
    scrollToAnchor($anchor);
  }
}

/**
 * Handle the behavior when somebody try to navigate through the keyboard arrows.
 * @returns {void}
 */
 const keyboardNavigation = (): void => {

  window.addEventListener('keydown', (evt) => {

    const $active = $pages.find(el => el.classList.contains('active')) as HTMLElement;
    if(!isPageTransitionRunning() && (<HTMLElement>evt.target)?.matches('body')){
      
      // If keyboard scrolling is enabled, move the main page with the keyboard arrows
      if(evt.keyCode === 38 || evt.keyCode === 33 || evt.keyCode === 37) (isScrolled('top', $active)) && moveToPrevPage();
      else if(evt.keyCode === 40 || evt.keyCode === 34 || evt.keyCode === 39) (isScrolled('bottom', $active)) && moveToNextPage();
      else if(evt.keyCode === 36) moveTo($firstPage);
      else if(evt.keyCode === 35) moveTo($lastPage);
    }
  });
}

/*-------------------------------------------------------------------------------
  Core methods
-------------------------------------------------------------------------------*/

/**
 * Creates a navigation bar.
 * @returns {void}
 */
function addNavigationBar(): void {

  const $nav = document.createElement('section');
  const $ul = document.createElement('ul');
  $nav.id = options.navigation!.container.replace(/^\.|#/, '');
  $nav.classList.add(options.navigation!.position);
  if(options.navigation!.class.length) $nav.classList.add(...options.navigation!.class);

  for(let i = 0; i < $pages.length; i++){

    let anchor, tooltip;
    const $li = document.createElement('li');
    if(options.anchors?.length) anchor = options.anchors[i];
    if(options.navigation?.tooltips.length) tooltip = (typeof(options.navigation.tooltips[i]) === 'undefined') ? '' : options.navigation.tooltips[i];
    if(tooltip) $li.dataset['tooltip'] = tooltip;
    $li.insertAdjacentHTML('beforeend', `
      <a href="#${anchor}"><span></span></a>
      ${tooltip ? `<section class="ps-tooltip ${options.navigation?.position}">${tooltip}</section>` : ''}
    `);
    $ul.insertAdjacentElement('beforeend', $li);
  }
  $nav.append($ul);
  document.body.insertAdjacentElement('beforeend', $nav);
}

/**
 * Activating the navigation bar option according to the curent page.
 * @param {string} name
 * @param {number} pageIndex
 * @returns {void}
 */
function handleNav(name: string, pageIndex: number): void {

  if(options.navigation){

    $navAnchors.find(el => el?.classList.contains('active'))?.classList.remove('active');
    if(name) $navAnchors.find(el => el?.href.includes(`#${name}`))?.classList.add('active');
    else $navAnchors[pageIndex]?.classList.add('active');
  }
}

/**
 * Retuns `prev` or `next` depending on the scrolling movement to reach its destination from the current page.
 * @param {HTMLElement} destiny
 * @returns {'prev'|'next'}
 */
function getMovementDirection(destiny: HTMLElement): string {

  const fromIndex = $pages.findIndex(el => el.classList.contains('active'));
  const toIndex = $pages.findIndex(el => el === destiny);
  return (fromIndex > toIndex) ? 'prev' : 'next';
}

/**
 * Add or remove a class to an element to apply an animation depending on the movement direction.
 * @param {HTMLElement} element
 * @param {string} translationClass
 * @param {string} movementDirection
 * @returns {void}
 */
function transformContainer(element: HTMLElement, translationClass: string, movementDirection: string): void {

  element.classList[(movementDirection === 'next') ? 'add' : 'remove'](translationClass);
}

/**
 * Performs the movement.
 * @param {object} proc
 * @returns {void}
 */
function performMovement(proc: MovementProcess): void {

  transformContainer(proc.animatePage!, proc.translationClass!, proc.movementDirection);
  proc.pagesToMove?.forEach(el => transformContainer(el, proc.translationClass!, proc.movementDirection));
  setTimeout(() => afterPageChange(proc), options.scrollingSpeed);
}

/**
 * Return the pages that are necesary to move with an single step.
 * @param {object} proc
 * @returns {array}
 */
function getPagesToMove(proc: MovementProcess): HTMLElement[] {

  let pagesToMove;
  if(proc.movementDirection === 'next'){

    pagesToMove = $pages.filter((el: HTMLElement, index: number): HTMLElement|false => {

      return (index < $pages.findIndex(subEl => (subEl === proc.destinyPage))) ? el : false;
    });
  }
  else {

    pagesToMove = $pages.filter((el: HTMLElement, index: number): HTMLElement|false => {

      return (index > $pages.findIndex(subEl => (subEl === proc.destinyPage))) ? el : false;
    })
  }
  return pagesToMove;
}

/**
 * Returns the scroll direction depending on the specified in the options.
 * @param {string} direction
 * @returns {string}
 */
function getDirection(direction: string): string {

  switch(direction){
    case 'left':
    case 'horizontal':
      return 'left';
    case 'right':
    case 'horizontal-inverted':
      return 'right';
    case 'down':
    case 'bottom':
    case 'vertical-inverted':
      return 'down';
    case 'up':
    case 'top':
    case 'vertical':
    default:
      return 'up';
  }
}

/**
 * Scrolls the page to the given destination.
 * @param {HTMLElement} destinyPage
 * @returns {void}
 */
function scrollPage(destinyPage: HTMLElement): void {

  const proc: MovementProcess = {
    activePage: $pages.find(el => el.classList.contains('active')),
    activePageIndex: $pages.findIndex(el => el.classList.contains('active')) + 1,
    destinyPage,
    destinyPageIndex: $pages.findIndex(el => el === destinyPage),
    destinyAnchor: destinyPage.id,
    movementDirection: getMovementDirection(destinyPage)
  };

  // Quiting when activeSection is the target element
  if(proc.activePage === destinyPage) return;
  if(options.hashHistorial && typeof proc.destinyAnchor !== 'undefined') setURLHash(proc.destinyAnchor);

  proc.activePage?.classList.remove('active');
  proc.destinyPage.classList.add('active');
  proc.pagesToMove = getPagesToMove(proc);
  proc.translationClass = `scrolled-${getDirection(options.direction!)}`;

  // Scrolling prev/next (moving pages next making them disappear or prev to the viewport)
  proc.animatePage = (proc.movementDirection === 'next') ? proc.activePage : destinyPage;

  // Hook
  beforePageChange(proc);

  // Movement execution
  performMovement(proc);
  if(options.navigation || options.navigation!.dynamic) handleNav(proc.destinyAnchor, proc.destinyPageIndex!);

  // Scroll timers
  let timeNow = new Date().getTime();
  lastScrolledDestiny = proc.destinyAnchor;
  lastAnimation = timeNow;
}

/**
 * Sets the URL hash for a page.
 * @param {string} anchorLink
 * @returns {void}
 */
function setURLHash(anchorLink: string): void {

  if(options.anchors!.length > 0) location.hash = anchorLink;
}

/**
 * Verifies a page with a given anchor, if exists scroll there. if there's not anchor it will take the url hash cleaned
 * @param {string|null} anchor
 * @returns {void}
 */
function scrollToAnchor(anchor?: string|null): void {

  // Getting the anchor link in the URL and deleting the `#`
  const pageAnchor = anchor || window.location.hash.replace('#', '');
  const $page = $pages.find(el => (el.id === pageAnchor));
  if($page) scrollPage($page);
}

/**
 * Determines if the transitions between pages is still taking place.
 * The variable `scrollDelay` adds a "save zone" for devices such as Apple laptops and Apple magic mouses
 * @returns {boolean}
 */
function isPageTransitionRunning(): boolean {

  let timeNow = new Date().getTime();
  // Cancel scroll if currently animating or within quiet period
  return ((timeNow - lastAnimation) < (scrollDelay + options.scrollingSpeed!));
}

/**
 * Returns a boolean depending on whether the scrollable element is at the end or at the start of the scrolling depending on the given type.
 * @param {string} type
 * @param {HTMLElement} scrollable
 * @returns {boolean}
 */
function isScrolled(type: string, scrollable: HTMLElement): boolean {

  return (type === 'top') ? !scrollable.scrollTop : ((scrollable.scrollTop + scrollable.offsetHeight) + 1) > scrollable.scrollHeight;
}

/**
 * Determines the way of scrolling up or down.
 * By 'automatically' scrolling a page or by using the default and normal scrolling.
 * @param {string} type
 * @param {HTMLElement} scrollable
 */
function scrolling(type: string, scrollable: HTMLElement): void {

  const check = (type == 'down') ? 'bottom' : 'top';
  const scroll = (type === 'down') ? moveToNextPage : moveToPrevPage;

  if(scrollable){
    // Scroll if it's scrollable and the scrollbar is at the start/end
    if(isScrolled(check, scrollable)) scroll();
    return;
  }
  // Moved up/down
  else scroll();
}

/**
 * Determines whether the active section or slide is scrollable through and scrolling bar.
 * @param {HTMLElement} activePage
 * @returns {HTMLElement|boolean}
 */
function isScrollable(activePage: HTMLElement): false|HTMLElement {

  return (activePage.classList.contains('ps-scrollable')) && activePage;
}

/*-------------------------------------------------------------------------------
  Hooks
-------------------------------------------------------------------------------*/

/**
 * Actions to execute after a secion is loaded
 * @param {object} proc
 */
function beforePageChange(proc: MovementProcess){

  (options.beforeSlide instanceof Function) && options.beforeSlide(proc);
}

/**
 * Actions to execute after a secion is loaded
 * @param {object} proc
 */
function afterPageChange(proc: MovementProcess){

  (options.afterSlide instanceof Function) && options.afterSlide(proc);
}

/*-------------------------------------------------------------------------------
  Handlers
-------------------------------------------------------------------------------*/

/**
* Gets the average of the last `number` elements of the given array.
* @param {array} elements
* @param {number} number
* @returns {number}
*/
function getAverage(elements: number[], number: number): number {

  let sum = 0;
  // Taking `number` elements from the end to make the average, if there are not enought, 1
  let lastElements = elements.slice(Math.max(elements.length - number, 1));

  for(let i = 0; i < lastElements.length; i++){

    sum += lastElements[i];
  }
  return Math.ceil(sum/number);
}

/**
 * Detecting mousewheel scrolling.
 * http://blogs.sitepointstatic.com/examples/tech/mouse-wheel/index.html
 * http://www.sitepoint.com/html5-javascript-mouse-wheel/
 * @param {event} evt
 * @returns {boolean}
 */
function mouseWheelHandler(evt: WheelEvent|any): false|void {

  evt = evt || window.event;
  // Time difference between the last scroll and the current one
  const curTime = new Date().getTime();
  const timeDiff = curTime - prevTime;
  prevTime = curTime;

  // Cross-browser wheel delta
  const value = evt.wheelDelta! || -evt.deltaY || -evt.detail;
  const delta = Math.max(-1, Math.min(1, value));
  const horizontalDetection = typeof evt.wheelDeltaX !== 'undefined' || typeof evt.deltaX !== 'undefined';
  const isScrollingVertically = (Math.abs(evt.wheelDeltaX) < Math.abs(evt.wheelDelta)) || (Math.abs(evt.deltaX ) < Math.abs(evt.deltaY) || !horizontalDetection);

  // Limiting the array to 150 (lets not waste memory!)
  if(scrollings.length > 149) scrollings.shift();

  // Keeping record of the previous scrollings
  scrollings.push(Math.abs(value));

  /**
   * Haven't they scrolled in a while? (enough to be consider a different scrolling action to scroll another section)
   * Emptying the array, we dont care about old scrollings for our averages.
   */
  if(timeDiff > 200) scrollings = [];

  if(!isPageTransitionRunning()){

    const averageEnd = getAverage(scrollings, 10);
    const averageMiddle = getAverage(scrollings, 70);
    const isAccelerating = averageEnd >= averageMiddle;

    if(isAccelerating && isScrollingVertically){

      const $activePage = $pages.find(el => el.classList.contains('active'));
      const scrollable = isScrollable($activePage!);

      // If it's scrolling down
      if(scrollable && delta < 0) scrolling('down', scrollable);
      // If it's scrolling up
      else if(scrollable && delta > 0) scrolling('up', scrollable);
    }
    return false;
  }
}

/**
 * Returns and object with Microsoft pointers (for IE<11 and for IE >= 11)
 * http://msdn.microsoft.com/en-us/library/ie/dn304886(v=vs.85).aspx
 * @returns {object}
 */
function getMSPointer(): Pointer {

  // MSPointers is for IE < 11 only and pointers IE >= 11 & rest of browsers
  const pointer: Pointer = (!window.PointerEvent) ? ({ down: 'MSPointerDown', move: 'MSPointerMove', up: 'MSPointerUp' }) : ({ down: 'pointerdown', move: 'pointermove', up: 'pointerup' });
  return pointer;
}

/**
 * As IE >= 10 fires both touch and mouse events when using a mouse in a touchscreen this way we make sure that is really a touch event what IE is detecting.
 * @param {event} evt
 * @returns {boolean}
 */
function isReallyTouch(evt: TouchEvent|any): boolean {

  // If is not IE || IE is detecting `touch` or `pen`
  return (typeof evt.pointerType === 'undefined' || evt.pointerType != 'mouse');
}

/**
 * Gets the pageX and pageY properties depending on the browser.
 * https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
 * @param {event} evt
 * @returns {object}
 */
function getTouchEventCoordinates(evt: TouchEvent|any): TouchCoordinates {

  const event: TouchCoordinates = {};
  event.y = (typeof evt.pageY !== 'undefined' && (evt.pageY || evt.pageX) ? evt.pageY : evt.touches[0].pageY);
  event.x = (typeof evt.pageX !== 'undefined' && (evt.pageY || evt.pageX) ? evt.pageX : evt.touches[0].pageX);
  return event;
}

/**
 * Set the coordinates of a movement.
 * @param {event} evt
 * @param {string} position
 * @returns {void}
 */
function setTouchCoordinates(evt: TouchEvent, position: string): void {

  const touchEvent = getTouchEventCoordinates(evt);
  coord[`touch${position}Y`] = touchEvent.y;
  coord[`touch${position}X`] = touchEvent.x;
}

/**
 * Setting the starting possitions of the touch event into coordinates object
 * @param {event} evt
 * @returns {void}
 */
function touchStartHandler(evt: TouchEvent): void {

  if(isReallyTouch(evt)) setTouchCoordinates(evt, 'Start');
}

/**
 * Calculate the movemente depending on the axis
 * @param {'x'|'y'} axis
 * @param {HTMLElement} scrollable
 * @returns {false|'down'|'up'}
 */
function calculateAxisTouchMovement(axis: string, scrollable: HTMLElement): string|boolean {

  const touchStart = coord[`touchStart${(axis === 'x') ? 'X' : 'Y'}`];
  const touchEnd = coord[`touchEnd${(axis === 'x') ? 'X' : 'Y'}`];
  const measurementUnit = (axis === 'x') ? 'Width' : 'Height';
  if(Math.abs(touchStart - touchEnd) > ((scrollable[`offset${measurementUnit}`] / 100) * options.touchSensitivity!)){

    return (touchStart > touchEnd) ? 'down' : ((touchEnd > touchStart) ? 'up' : false);
  }
  return false;
}

/**
 * Detecting touch events.
 * @param {event} evt,
 * @returns {void}
 */
function touchMoveHandler(evt: TouchEvent|any): void {

  if(isReallyTouch(evt)){

    const $activePage = $pages.find(el => el.classList.contains('active'));
    const scrollable = isScrollable($activePage!);

    if(!scrollable) evt.preventDefault();
    if(scrollable && !isPageTransitionRunning()){

      setTouchCoordinates(evt, 'End');
      const scrollIsHorizontal = getDirection(options.direction!) === 'left' || getDirection(options.direction!) === 'right';
      const direction = (scrollIsHorizontal && Math.abs(coord.touchStartX - coord.touchEndX) > Math.abs(coord.touchStartY - coord.touchEndY)) // X movement bigger than Y movement?
                          ? calculateAxisTouchMovement('x', scrollable)
                          : calculateAxisTouchMovement('y', scrollable);
      if(direction) scrolling(<string>direction, scrollable);
    }
  }
}

/*-------------------------------------------------------------------------------
  Listeners
-------------------------------------------------------------------------------*/

/**
 * Adds the auto scrolling action for the mouse wheel and tackpad.
 * After this function is called, the mousewheel and trackpad movements will scroll through sections.
 * @returns {void}
 */
function addMouseWheelHandler(): void {


  if('attachEvent' in $container) (<HTMLElement|any>$container).attachEvent('onmousewheel', mouseWheelHandler); // IE 6/7/8
  else {
    $container.addEventListener('mousewheel', mouseWheelHandler, false); // IE9, Chrome, Safari, Opera
    $container.addEventListener('wheel', mouseWheelHandler, false); // Firefox
  }
}

/**
 * Removes the auto scrolling action fired by the mouse wheel and tackpad.
 * After this function is called, the mousewheel and trackpad movements won't scroll through sections.
 * @returns {void}
 */
function removeMouseWheelHandler(): void {

  if('detachEvent' in $container) (<HTMLElement|any>$container).detachEvent('onmousewheel', mouseWheelHandler); // IE 6/7/8
  else {
    $container.removeEventListener('mousewheel', mouseWheelHandler, false); // IE9, Chrome, Safari, Opera
    $container.removeEventListener('wheel', mouseWheelHandler, false); // Firefox
  }
}

/**
 * Adds the possibility to auto scroll through sections on touch devices.
 * @returns {void}
 */
function addTouchHandler(): void {

  if(isTouch){

    // Microsoft pointers
    const pointer = getMSPointer();
    $container[pointer.down] = touchStartHandler;
    $container[pointer.move] = touchMoveHandler;

    $container.ontouchstart = touchStartHandler;
    $container.ontouchmove = touchMoveHandler;
  }
}

/**
 * Removes the auto scrolling for touch devices.
 * @returns {void}
 */
function removeTouchHandler(): void {

  if(isTouch){

    // Microsoft pointers
    const pointer = getMSPointer();
    $container[pointer.down] = null;
    $container[pointer.move] = null;

    $container.ontouchstart = null;
    $container.ontouchmove = null;
  }
}

/**
 * Actions to do when the hash (#) in the URL changes.
 * @returns {void}
 */
function hashChangeHandler(): void {

  const pageAnchor = window.location.hash.replace('#', '').split('/')[0];
  if(pageAnchor){

    /**
     * In order to call scrollpage() only once for each destination at a time it
     * is called twice for each scroll otherwise, as in case of using anchorlinks
     * `hashChange` event is fired on every scroll too.
     */
    if(pageAnchor !== lastScrolledDestiny){

      const page = ((typeof(pageAnchor) != 'number') ? document.getElementById(pageAnchor) : $pages[pageAnchor - 1]) as HTMLElement;
      scrollPage(page);
    }
  }
}

export { defineConfig, setAllowScrolling, setScrollingSpeed, setKeyboardScrolling, setMouseWheelScrolling, moveToPrevPage, moveToNextPage, moveTo, init };
