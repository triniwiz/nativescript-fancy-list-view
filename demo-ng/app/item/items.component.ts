import { Component, NgZone, OnInit } from '@angular/core';

import { Item } from './item';
import { ItemService } from './item.service';
import { Router } from '@angular/router';

@Component({
    selector: 'ns-items',
    moduleId: __filename,
    templateUrl: './items.component.html',
})
export class ItemsComponent implements OnInit {
    items: Item[];
    layoutType = 'linear';
    selectedList: number = 0;
    spanCount = 2;
    // This pattern makes use of Angular’s dependency injection implementation to inject an instance of the ItemService service into this class. 
    public templateSelector = (item: any, index: number, items: any) => {
        return index % 2 === 0 ? 'even' : 'odd';
    };

    // Angular knows about this service because it is included in your app’s main NgModule, defined in app.module.ts.
    constructor(private itemService: ItemService, private router: Router, private zone: NgZone) {
    }

    ngOnInit(): void {
        this.items = this.itemService.getItems();
    }


    default() {
        this.setLayoutAndList('linear', 0);
    }

    multi() {
        this.setLayoutAndList('linear', 1);
    }

    grid() {
        this.setLayoutAndList('grid', 0);
    }

    staggered() {
        this.setLayoutAndList('staggered', 0);
    }

    setLayoutAndList(layout: string, list: number) {
        this.zone.run(() => {
            this.layoutType = layout;
            this.selectedList = list;
        });
    }

    updateSpan(span) {
        this.spanCount = span.text;
    }
}