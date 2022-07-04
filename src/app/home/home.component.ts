import { Component, OnInit } from '@angular/core';
import { DataSharingService } from 'kwoo-test-lib';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  counter$ = this.dataSharingService.counter$;

  constructor(private dataSharingService: DataSharingService) { }

  ngOnInit(): void {
  }

  incrementCounter(): void {
    this.dataSharingService.incrementCounter();
  }
}
