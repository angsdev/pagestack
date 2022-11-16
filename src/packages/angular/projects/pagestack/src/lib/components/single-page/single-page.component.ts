import { Component, Input, OnInit, AfterViewInit } from '@angular/core';

import { PagestackService } from '../../services/pagestack.service';

@Component({
  selector: 'ps-page',
  host: {
    'class': 'ps-page',
    '[class.ps-scrollable]': 'scrollable'
  },
  templateUrl: './single-page.component.html',
  styleUrls: ['./single-page.component.scss']
})
export class SinglePageComponent implements OnInit, AfterViewInit {

  @Input('scrollable') public scrollable: boolean = false;

  constructor(private pagestack: PagestackService){

  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

  }
}
