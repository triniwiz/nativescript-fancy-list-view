import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from '../main-view-model';

let vm = new HelloWorldModel();

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
    // Get the event sender
    let page = <pages.Page>args.object;
    page.bindingContext = vm;
    const listView = page.getViewById('listView');
    listView.on('itemSelected', onItemSelected.bind(this));
    listView.on('itemDeselected', onItemDeselected.bind(this));
}

export function onItemSelected(args) {
    const index = args.index;
    const item = vm.items.getItem(index);
    item.selected = true;
    vm.items.setItem(index, item);
    console.log('onItemSelected');
}

export function onItemDeselected(args) {
    const index = args.index;
    const item = vm.items.getItem(index);
    item.selected = false;
    vm.items.setItem(index, item);
    console.log('onItemDeSelected');
}