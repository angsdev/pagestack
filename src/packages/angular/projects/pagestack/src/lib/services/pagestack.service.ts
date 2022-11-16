import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class PagestackService {

  /**
 * Defines the delay to take place before being able to scroll to the next section
 * BE CAREFUL! Not recommened to change it under 400 for a good behavior in laptops and
 * Apple devices (laptops, mouses...)
 **/
  private scrollDelay: number = 1500;

  // Default options, extended with any options that were provided.
  private options: ExecutingOptions = {
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
  private isTouch: boolean|number = ('ontouchstart' in window) || ('msMaxTouchPoints' in navigator) || (navigator.maxTouchPoints);
  private coord: CompleteTouchCoordinates = { touchStartY: 0, touchStartX: 0, touchEndY: 0, touchEndX: 0 };
  private scrollings: number[] = [];
  private lastAnimation: number = 0;
  private lastScrolledDestiny!: string;
  private prevTime: number = new Date().getTime();

  // Element containers
  private $container!: HTMLElement & DynamicPropertyChoosing;
  private $pages!: HTMLElement[];
  private $firstPage!: HTMLElement;
  private $lastPage!: HTMLElement;
  private $navbar!: HTMLElement|null;
  private $listItems!: HTMLElement[];
  private $navAnchors!: (HTMLAnchorElement|null)[];


  constructor(){

    this.moveTo = this.moveTo.bind(this);
    this.moveToPrevPage = this.moveToPrevPage.bind(this);
    this.moveToNextPage = this.moveToNextPage.bind(this);
    this.hashChangeHandler = this.hashChangeHandler.bind(this);
    this.mouseWheelHandler = this.mouseWheelHandler.bind(this);
    this.touchStartHandler = this.touchStartHandler.bind(this);
    this.touchMoveHandler = this.touchMoveHandler.bind(this);
    this.delegatedClickEvents = this.delegatedClickEvents.bind(this);
  }

  /*-------------------------------------------------------------------------------
    Accesible methods
  -------------------------------------------------------------------------------*/

  /**
    * Combine the default options with the given and locate the main elements.
    * @param {object} customOptions
    * @returns {void}
    */
  defineConfig(customOptions: ExecutingOptions): void {

    // Default options, extended with any options that were provided.
    Object.assign(this.options, customOptions);
    this.options.navigation = Object.assign({
      dynamic: false,
      position: 'right',
      container: '#ps-nav',
      class: [],
      tooltips: []
    }, customOptions.navigation);
  }

  /**
    * Adds or remove the possiblity of scrolling through sections by using the mouse wheel/trackpad or touch gestures.
    * @param {boolean} value
    * @returns {void}
    */
  setAllowScrolling(value: boolean): void {

    this.setMouseWheelScrolling(value);
    (value) ? this.addTouchHandler() : this.removeTouchHandler();
  }

  /**
    * Defines the scrolling speed.
    * @param {number} value
    * @returns {number}
    */
  setScrollingSpeed(value: number): number {
    return (this.options.scrollingSpeed = value);
  }

  /**
    * Adds or remove the possiblity of scrolling through sections by using the keyboard arrow keys
    * @param {boolean} value
    * @returns {boolean}
    */
  setKeyboardScrolling(value: boolean): boolean {
    return (this.options.keyboardScrolling = value);
  }

  /**
    * Adds or remove the possiblity of scrolling through sections by using the mouse wheel or the trackpad.
    * @param {boolean} value
    * @returns {void}
    */
  setMouseWheelScrolling(value: boolean): void {
    return ((value) ? this.addMouseWheelHandler() : this.removeMouseWheelHandler());
  }

  /**
    * Moves to the previous page.
    * @returns {void}
    */
  moveToPrevPage(): void {

    const $active = this.$pages.find(el => el.classList.contains('active')) as HTMLElement;
    let $prev = this.$pages[this.$pages.indexOf($active) - 1];
    // If there's no more pages above and loopTop option is enabled then looping to the bottom
    if(!$prev && this.options.loopTop) $prev = this.$lastPage;
    if($prev) this.scrollPage($prev);
  }

  /**
    * Moves to the next page.
    * @returns {void}
    */
  moveToNextPage(): void {

    const $active = this.$pages.find(el => el.classList.contains('active')) as HTMLElement;
    let $next = this.$pages[this.$pages.indexOf($active) + 1];
    // If there's no more pages below and loopTop option is enabled then looping to the top
    if(!$next && this.options.loopBottom) $next = this.$firstPage;
    if($next) this.scrollPage($next);
  }

  /**
    * Moves the site to the given index or element.
    * @param {HTMLElement|number} page
    * @returns {void}
    */
  moveTo(page: number|HTMLElement): void {

    const destiny = (typeof(page) != 'number') ? page : this.$pages[page - 1];
    if(destiny) this.scrollPage(destiny);
  }

  /**
    * Initialization.
    * @returns {void}
    */
  init(): void {

    // Main containers
    this.$container = document.querySelector(this.options.container!.toString()) as HTMLElement;
    this.$pages = Array.from(this.$container!.querySelectorAll(this.options.pageSelector!));
    this.$firstPage = this.$pages[0];
    this.$lastPage = this.$pages[this.$pages.length - 1];
    // Nav containers
    this.$navbar = document.querySelector(this.options.navigation!.container);
    this.$listItems = Array.from(this.$navbar!.querySelectorAll('li, [anchor]'));
    this.$navAnchors = this.$listItems.map(el => el.querySelector('a'));

    /**
      * Giving respective index and positioning on active page if there's one, if not the first one.
      */
    new Promise<void>(resolve => {

      const $active = this.$pages.find(subEl => subEl.classList.contains('active'));
      for(let i = 0, zIndex = this.$pages.length, length = this.$pages.length; i < length; i++, zIndex--){

        const $el = this.$pages[i];
        $el.style.zIndex = zIndex.toString();
        // If there's no active page, the 1st one will be the default one
        if(!i && !$active) $el.classList.add('active');
      }
      return resolve();
    }).then(() => {

      if(this.$navbar){

        const $activePageIndex: number = this.$pages.findIndex(el => el.classList.contains('active'));
        this.$listItems[$activePageIndex].querySelector('a')!.classList.add('active');
      }
    }).catch(console.error);

    /**
      * Initialize the scrolling
      */
    this.setAllowScrolling(true);

    /**
      * If when the window loads, it exists a anchor on the url hash and it matches with any page one it will scroll there.
      * Detecting any change on the URL to scroll to the given anchor link (a way to detect back history button as we play with the hashes on the URL).
      */
    if(this.options.hashHistorial){

      window.addEventListener('load', () => this.scrollToAnchor());
      window.addEventListener('hashchange', this.hashChangeHandler);
    }

    /**
      * Only if navigation dynamic property is setted to true the navigation bar will be created.
      */
    if(this.options.navigation?.dynamic) this.addNavigationBar();

    /**
      * Sliding with arrow keys, both, vertical and horizontal.
      */
    if(this.options.keyboardScrolling) this.keyboardNavigation();

    /**
      * Scrolls to the section when clicking the navigation bullet.
      */
    document.addEventListener('click', this.delegatedClickEvents);
    document.addEventListener('touchstart', this.delegatedClickEvents);
  }

  /**
    * Click and touch delegated events.
    * @returns {void}
    */
  delegatedClickEvents(evt: MouseEvent|PointerEvent|TouchEvent): void {

    const $el = evt.target as HTMLElement;

    const $anchorClose = $el.closest(`${this.options.navigation?.container} li,
                                      ${this.options.navigation?.container} [anchor]`);

    if($anchorClose){

      const $li = $anchorClose as HTMLElement;
      const index = Array.from($li.parentElement!.children).findIndex(li => (li === $li));
      this.scrollPage(this.$pages[index]);
    }

    if(this.options.menu && $el.matches(`${this.options.menu} [data-anchor]`) || $el.closest(`${this.options.menu} [data-anchor]`)){
      evt.stopPropagation();

      const $anchor = ($el.closest('[data-anchor]') as HTMLElement)?.dataset['anchor'];
      this.scrollToAnchor($anchor);
    }
  }

  /**
   * Handle the behavior when somebody try to navigate through the keyboard arrows.
   * @returns {void}
   */
  keyboardNavigation(): void {

    window.addEventListener('keydown', (evt: KeyboardEvent) => {

      const $active = this.$pages.find(el => el.classList.contains('active')) as HTMLElement;
      if(!this.isPageTransitionRunning() && (<HTMLElement>evt.target).matches('body')){

        // If keyboard scrolling is enabled, move the main page with the keyboard arrows
        if(evt.keyCode === 38 || evt.keyCode === 33 || evt.keyCode === 37) (this.isScrolled('top', $active)) && this.moveToPrevPage();
        else if(evt.keyCode === 40 || evt.keyCode === 34 || evt.keyCode === 39) (this.isScrolled('bottom', $active)) && this.moveToNextPage();
        else if(evt.keyCode === 36) this.moveTo(this.$firstPage);
        else if(evt.keyCode === 35) this.moveTo(this.$lastPage);
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
  addNavigationBar(): void {

    const $nav = document.createElement('section');
    const $ul = document.createElement('ul');
    $nav.id = this.options.navigation!.container.replace(/^\.|#/, '');
    $nav.classList.add(this.options.navigation!.position);
    if(this.options.navigation!.class.length) $nav.classList.add(...this.options.navigation!.class);

    for(let i = 0; i < this.$pages.length; i++){

      let anchor, tooltip;
      const $li = document.createElement('li');
      if(this.options.anchors?.length) anchor = this.options.anchors[i];
      if(this.options.navigation?.tooltips.length) tooltip = (typeof(this.options.navigation.tooltips[i]) === 'undefined') ? '' : this.options.navigation.tooltips[i];
      if(tooltip) $li.dataset['tooltip'] = tooltip;
      $li.insertAdjacentHTML('beforeend', `
        <a href="#${anchor}"><span></span></a>
        ${tooltip ? `<section class="ps-tooltip ${this.options.navigation?.position}">${tooltip}</section>` : ''}
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
  handleNav(name: string, pageIndex: number): void {

    if(this.options.navigation){

      this.$navAnchors.find(el => el?.classList.contains('active'))?.classList.remove('active');
      if(name) this.$navAnchors.find(el => el?.href.includes(`#${name}`))?.classList.add('active');
      else this.$navAnchors[pageIndex]?.classList.add('active');
    }
  }

  /**
    * Retuns `prev` or `next` depending on the scrolling movement to reach its destination from the current page.
    * @param {HTMLElement} destiny
    * @returns {'prev'|'next'}
    */
  getMovementDirection(destiny: HTMLElement): string {

    const fromIndex = this.$pages.findIndex(el => el.classList.contains('active'));
    const toIndex = this.$pages.findIndex(el => el === destiny);
    return (fromIndex > toIndex) ? 'prev' : 'next';
  }

  /**
    * Add or remove a class to an element to apply an animation depending on the movement direction.
    * @param {HTMLElement} element
    * @param {string} translationClass
    * @param {string} movementDirection
    * @returns {void}
    */
  transformContainer(element: HTMLElement, translationClass: string, movementDirection: string): void {

    element.classList[(movementDirection === 'next') ? 'add' : 'remove'](translationClass);
  }

  /**
    * Performs the movement.
    * @param {object} proc
    * @returns {void}
    */
  performMovement(proc: MovementProcess): void {

    this.transformContainer(proc.animatePage!, proc.translationClass!, proc.movementDirection);
    proc.pagesToMove?.forEach(el => this.transformContainer(el, proc.translationClass!, proc.movementDirection));
    setTimeout(() => this.afterPageChange(proc), this.options.scrollingSpeed);
  }

  /**
    * Return the pages that are necesary to move with an single step.
    * @param {object} proc
    * @returns {array}
    */
  getPagesToMove(proc: MovementProcess): HTMLElement[] {

    let pagesToMove;
    if(proc.movementDirection === 'next'){

      pagesToMove = this.$pages.filter((el: HTMLElement, index: number): HTMLElement|false => {

        return (index < this.$pages.findIndex(subEl => (subEl === proc.destinyPage))) ? el : false;
      });
    }
    else {

      pagesToMove = this.$pages.filter((el: HTMLElement, index: number): HTMLElement|false => {

        return (index > this.$pages.findIndex(subEl => (subEl === proc.destinyPage))) ? el : false;
      })
    }
    return pagesToMove;
  }

  /**
    * Returns the scroll direction depending on the specified in the options.
    * @param {string} direction
    * @returns {string}
    */
  getDirection(direction: string): string {

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
  scrollPage(destinyPage: HTMLElement): void {

    const proc: MovementProcess = {
      activePage: this.$pages.find(el => el.classList.contains('active')),
      activePageIndex: this.$pages.findIndex(el => el.classList.contains('active')) + 1,
      destinyPage,
      destinyPageIndex: this.$pages.findIndex(el => el === destinyPage),
      destinyAnchor: destinyPage.id,
      movementDirection: this.getMovementDirection(destinyPage)
    };

    // Quiting when activeSection is the target element
    if(proc.activePage === destinyPage) return;
    if(this.options.hashHistorial && typeof proc.destinyAnchor !== 'undefined') this.setURLHash(proc.destinyAnchor);

    proc.activePage?.classList.remove('active');
    proc.destinyPage.classList.add('active');
    proc.pagesToMove = this.getPagesToMove(proc);
    proc.translationClass = `scrolled-${this.getDirection(this.options.direction!)}`;

    // Scrolling prev/next (moving pages next making them disappear or prev to the viewport)
    proc.animatePage = (proc.movementDirection === 'next') ? proc.activePage : destinyPage;

    // Hook
    this.beforePageChange(proc);

    // Movement execution
    this.performMovement(proc);
    if(this.options.navigation || this.options.navigation!.dynamic) this.handleNav(proc.destinyAnchor, proc.destinyPageIndex!);

    // Scroll timers
    let timeNow = new Date().getTime();
    this.lastScrolledDestiny = proc.destinyAnchor;
    this.lastAnimation = timeNow;
  }

  /**
    * Sets the URL hash for a page.
    * @param {string} anchorLink
    * @returns {void}
    */
  setURLHash(anchorLink: string): void {

    if(this.options.anchors!.length > 0) location.hash = anchorLink;
  }

  /**
    * Verifies a page with a given anchor, if exists scroll there. if there's not anchor it will take the url hash cleaned
    * @param {string|null} anchor
    * @returns {void}
    */
  scrollToAnchor(anchor?: string|null): void {

    // Getting the anchor link in the URL and deleting the `#`
    const pageAnchor = anchor || window.location.hash.replace('#', '');
    const $page = this.$pages.find(el => (el.id === pageAnchor));
    if($page) this.scrollPage($page);
  }

  /**
    * Determines if the transitions between pages is still taking place.
    * The variable `scrollDelay` adds a "save zone" for devices such as Apple laptops and Apple magic mouses
    * @returns {boolean}
    */
  isPageTransitionRunning(): boolean {

    let timeNow = new Date().getTime();
    // Cancel scroll if currently animating or within quiet period
    return ((timeNow - this.lastAnimation) < (this.scrollDelay + this.options.scrollingSpeed!));
  }

  /**
    * Returns a boolean depending on whether the scrollable element is at the end or at the start of the scrolling depending on the given type.
    * @param {string} type
    * @param {HTMLElement} scrollable
    * @returns {boolean}
    */
  isScrolled(type: string, scrollable: HTMLElement): boolean {

    return (type === 'top') ? !scrollable.scrollTop : ((scrollable.scrollTop + scrollable.offsetHeight) + 1) > scrollable.scrollHeight;
  }

  /**
    * Determines the way of scrolling up or down.
    * By 'automatically' scrolling a page or by using the default and normal scrolling.
    * @param {string} type
    * @param {HTMLElement} scrollable
    */
  scrolling(type: string, scrollable: HTMLElement): void {

    const check = (type == 'down') ? 'bottom' : 'top';
    const scroll = (type === 'down') ? this.moveToNextPage : this.moveToPrevPage;

    if(scrollable){
      // Scroll if it's scrollable and the scrollbar is at the start/end
      if(this.isScrolled(check, scrollable)) scroll();
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
  isScrollable(activePage: HTMLElement): false|HTMLElement {

    return (activePage.classList.contains('ps-scrollable')) && activePage;
  }

  /*-------------------------------------------------------------------------------
    Hooks
  -------------------------------------------------------------------------------*/

  /**
    * Actions to execute after a secion is loaded
    * @param {object} proc
    */
  beforePageChange(proc: MovementProcess){

    (this.options.beforeSlide instanceof Function) && this.options.beforeSlide(proc);
  }

  /**
    * Actions to execute after a secion is loaded
    * @param {object} proc
    */
  afterPageChange(proc: MovementProcess){

    (this.options.afterSlide instanceof Function) && this.options.afterSlide(proc);
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
  getAverage(elements: number[], number: number): number {

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
  mouseWheelHandler(evt: WheelEvent|any): false|void {

    evt = evt || window.event;
    // Time difference between the last scroll and the current one
    const curTime = new Date().getTime();
    const timeDiff = curTime - this.prevTime;
    this.prevTime = curTime;

    // Cross-browser wheel delta
    const value = evt.wheelDelta! || -evt.deltaY || -evt.detail;
    const delta = Math.max(-1, Math.min(1, value));
    const horizontalDetection = typeof evt.wheelDeltaX !== 'undefined' || typeof evt.deltaX !== 'undefined';
    const isScrollingVertically = (Math.abs(evt.wheelDeltaX) < Math.abs(evt.wheelDelta)) || (Math.abs(evt.deltaX ) < Math.abs(evt.deltaY) || !horizontalDetection);

    // Limiting the array to 150 (lets not waste memory!)
    if(this.scrollings.length > 149) this.scrollings.shift();

    // Keeping record of the previous scrollings
    this.scrollings.push(Math.abs(value));

    /**
      * Haven't they scrolled in a while? (enough to be consider a different scrolling action to scroll another section)
      * Emptying the array, we dont care about old scrollings for our averages.
      */
    if(timeDiff > 200) this.scrollings = [];

    if(!this.isPageTransitionRunning()){

      const averageEnd = this.getAverage(this.scrollings, 10);
      const averageMiddle = this.getAverage(this.scrollings, 70);
      const isAccelerating = averageEnd >= averageMiddle;

      if(isAccelerating && isScrollingVertically){

        const $activePage = this.$pages.find(el => el.classList.contains('active'));
        const scrollable = this.isScrollable($activePage!);

        // If it's scrolling down
        if(scrollable && delta < 0) this.scrolling('down', scrollable);
        // If it's scrolling up
        else if(scrollable && delta > 0) this.scrolling('up', scrollable);
      }
      return false;
    }
  }

  /**
    * Returns and object with Microsoft pointers (for IE<11 and for IE >= 11)
    * http://msdn.microsoft.com/en-us/library/ie/dn304886(v=vs.85).aspx
    * @returns {object}
    */
  getMSPointer(): Pointer {

    // MSPointers is for IE < 11 only and pointers IE >= 11 & rest of browsers
    const pointer: Pointer = (!window.PointerEvent) ? ({ down: 'MSPointerDown', move: 'MSPointerMove', up: 'MSPointerUp' }) : ({ down: 'pointerdown', move: 'pointermove', up: 'pointerup' });
    return pointer;
  }

  /**
    * As IE >= 10 fires both touch and mouse events when using a mouse in a touchscreen this way we make sure that is really a touch event what IE is detecting.
    * @param {event} evt
    * @returns {boolean}
    */
  isReallyTouch(evt: TouchEvent|any): boolean {

    // If is not IE || IE is detecting `touch` or `pen`
    return (typeof evt.pointerType === 'undefined' || evt.pointerType != 'mouse');
  }

  /**
    * Gets the pageX and pageY properties depending on the browser.
    * https://github.com/alvarotrigo/fullPage.js/issues/194#issuecomment-34069854
    * @param {event} evt
    * @returns {object}
    */
  getTouchEventCoordinates(evt: TouchEvent|any): TouchCoordinates {

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
  setTouchCoordinates(evt: TouchEvent, position: string): void {

    const touchEvent = this.getTouchEventCoordinates(evt);
    this.coord[`touch${position}Y`] = touchEvent.y;
    this.coord[`touch${position}X`] = touchEvent.x;
  }

  /**
    * Setting the starting possitions of the touch event into coordinates object
    * @param {event} evt
    * @returns {void}
    */
  touchStartHandler(evt: TouchEvent|any): void {

    if(this.isReallyTouch(evt)) this.setTouchCoordinates(evt, 'Start');
  }

  /**
    * Calculate the movemente depending on the axis
    * @param {'x'|'y'} axis
    * @param {HTMLElement} scrollable
    * @returns {false|'down'|'up'}
    */
  calculateAxisTouchMovement(axis: string, scrollable: HTMLElement): string|boolean {

    const touchStart = this.coord[`touchStart${(axis === 'x') ? 'X' : 'Y'}`];
    const touchEnd = this.coord[`touchEnd${(axis === 'x') ? 'X' : 'Y'}`];
    const measurementUnit = (axis === 'x') ? 'Width' : 'Height';
    if(Math.abs(touchStart - touchEnd) > ((scrollable[`offset${measurementUnit}`] / 100) * this.options.touchSensitivity!)){

      return (touchStart > touchEnd) ? 'down' : ((touchEnd > touchStart) ? 'up' : false);
    }
    return false;
  }

  /**
    * Detecting touch events.
    * @param {event} evt,
    * @returns {void}
    */
  touchMoveHandler(evt: TouchEvent|any): void {

    if(this.isReallyTouch(evt)){

      const $activePage = this.$pages.find(el => el.classList.contains('active'));
      const scrollable = this.isScrollable($activePage!);

      if(!scrollable) evt.preventDefault();
      if(scrollable && !this.isPageTransitionRunning()){

        this.setTouchCoordinates(evt, 'End');
        const scrollIsHorizontal = this.getDirection(this.options.direction!) === 'left' || this.getDirection(this.options.direction!) === 'right';
        const direction = (scrollIsHorizontal && Math.abs(this.coord.touchStartX - this.coord.touchEndX) > Math.abs(this.coord.touchStartY - this.coord.touchEndY)) // X movement bigger than Y movement?
                            ? this.calculateAxisTouchMovement('x', scrollable)
                            : this.calculateAxisTouchMovement('y', scrollable);
        if(direction) this.scrolling(<string>direction, scrollable);
      }
    }
  }

  /*-------------------------------------------------------------------------------
    Listeners
  -------------------------------------------------------------------------------*/

  /**
    * Event prevention and progagation one line sentence.
    * @param {event} evt
    * @returns {void}
    */
  preventAndStop(evt: Event): void {
    evt['preventDefault']();
    evt['stopPropagation']();
  }

  /**
    * Adds the auto scrolling action for the mouse wheel and tackpad.
    * After this function is called, the mousewheel and trackpad movements will scroll through sections.
    * @returns {void}
    */
  addMouseWheelHandler(): void {


    if('attachEvent' in this.$container) (<HTMLElement|any>this.$container).attachEvent('onmousewheel', this.mouseWheelHandler); // IE 6/7/8
    else {
      this.$container.addEventListener('mousewheel', this.mouseWheelHandler, false); // IE9, Chrome, Safari, Opera
      this.$container.addEventListener('wheel', this.mouseWheelHandler, false); // Firefox
    }
  }

  /**
    * Removes the auto scrolling action fired by the mouse wheel and tackpad.
    * After this function is called, the mousewheel and trackpad movements won't scroll through sections.
    * @returns {void}
    */
  removeMouseWheelHandler(): void {

    if('detachEvent' in this.$container) (<HTMLElement|any>this.$container).detachEvent('onmousewheel', this.mouseWheelHandler); // IE 6/7/8
    else {
      this.$container.removeEventListener('mousewheel', this.mouseWheelHandler, false); // IE9, Chrome, Safari, Opera
      this.$container.removeEventListener('wheel', this.mouseWheelHandler, false); // Firefox
    }
  }

  /**
    * Adds the possibility to auto scroll through sections on touch devices.
    * @returns {void}
    */
  addTouchHandler(): void {

    if(this.isTouch){

      // Microsoft pointers
      const pointer = this.getMSPointer();
      this.$container[pointer.down] = this.touchStartHandler;
      this.$container[pointer.move] = this.touchMoveHandler;

      this.$container.ontouchstart = this.touchStartHandler;
      this.$container.ontouchmove = this.touchMoveHandler;
    }
  }

  /**
    * Removes the auto scrolling for touch devices.
    * @returns {void}
    */
  removeTouchHandler(): void {

    if(this.isTouch){

      // Microsoft pointers
      const pointer = this.getMSPointer();
      this.$container[pointer.down] = null;
      this.$container[pointer.move] = null;

      this.$container.ontouchstart = null;
      this.$container.ontouchmove = null;
    }
  }

  /**
    * Actions to do when the hash (#) in the URL changes.
    * @returns {void}
    */
  hashChangeHandler(): void {

    const pageAnchor = window.location.hash.replace('#', '').split('/')[0];
    if(pageAnchor){

      /**
        * In order to call scrollpage() only once for each destination at a time it
        * is called twice for each scroll otherwise, as in case of using anchorlinks
        * `hashChange` event is fired on every scroll too.
        */
      if(pageAnchor !== this.lastScrolledDestiny){

        const page = ((typeof(pageAnchor) != 'number') ? document.getElementById(pageAnchor) : this.$pages[pageAnchor - 1]) as HTMLElement;
        this.scrollPage(page);
      }
    }
  }
}
