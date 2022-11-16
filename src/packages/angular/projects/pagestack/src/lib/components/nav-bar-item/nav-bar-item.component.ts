import { Component, Input, OnInit } from '@angular/core';

import { PagestackService } from '../../services/pagestack.service';

@Component({
  selector: 'ps-nav-item',
  templateUrl: './nav-bar-item.component.html',
  styleUrls: ['./nav-bar-item.component.scss']
})
export class NavBarItemComponent implements OnInit {

  @Input('anchor') public anchor!: string;

  constructor(private pagestack: PagestackService){

  }

  ngOnInit(): void {

  }
}
