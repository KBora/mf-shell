import { Component, OnInit } from '@angular/core';
import { DataSharingService } from 'kwoo-test-lib';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  counter$ = this.dataSharingService.counter$;
  constructor(private dataSharingService: DataSharingService) { }

  ngOnInit(): void {
  }

}
