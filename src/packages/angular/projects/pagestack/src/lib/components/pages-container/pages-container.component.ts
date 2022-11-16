import { Component, Input, OnInit, AfterViewInit } from '@angular/core';

import { PagestackService } from '../../services/pagestack.service';


@Component({
  selector: 'ps-container',
  host: { '[id]': 'id' },
  templateUrl: './pages-container.component.html'
})
export class PagesContainerComponent implements OnInit, AfterViewInit {

  @Input('id') public id: string = 'ps-pages';

  constructor(private pagestack: PagestackService){

  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

  }
}
