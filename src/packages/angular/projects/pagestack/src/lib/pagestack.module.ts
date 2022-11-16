import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { PagesContainerComponent } from './components/pages-container/pages-container.component';
import { SinglePageComponent } from './components/single-page/single-page.component';
import { NavBarItemComponent } from './components/nav-bar-item/nav-bar-item.component';


@NgModule({
  declarations: [
    NavBarComponent,
    NavBarItemComponent,
    PagesContainerComponent,
    SinglePageComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    NavBarComponent,
    NavBarItemComponent,
    PagesContainerComponent,
    SinglePageComponent
  ]
})
export class PagestackModule { }
