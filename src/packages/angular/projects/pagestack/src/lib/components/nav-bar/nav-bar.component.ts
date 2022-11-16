import { Component, Input, OnInit } from '@angular/core';

import { PagestackService } from '../../services/pagestack.service';

@Component({
  selector: 'ps-nav',
  host: {
    '[id]': 'id',
    '[class]': 'position+\' \'+class'
  },
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit {

  @Input() public id: string = 'ps-nav';
  @Input() public class: string = '';
  @Input() public position: string = 'right';

  constructor(private pagestack: PagestackService){

  }

  ngOnInit(): void {

  }
}
