import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from './main-view-model';
import { topmost } from 'tns-core-modules/ui/frame/frame';
import * as http from 'tns-core-modules/http';

let vm = new HelloWorldModel();

// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
    // Get the event sender
    let page = <pages.Page>args.object;
    page.bindingContext = vm;
    const listView = page.getViewById('listView');
    listView.on('pullToRefreshInitiated', onPullToRefreshInitiated.bind(this));
}

export function multi(args) {
    topmost().navigate('multi-page');
}

export function grid(args) {
    topmost().navigate('grid-page');
}

export function stagger(args) {
    topmost().navigate('stagger-page');
}

export function selection(args) {
    topmost().navigate('selection/selection-page');
}

export function onPullToRefreshInitiated(args) {
    const listView = args.object;
    const items = listView.items;
    let firstItem = items.getItem ? items.getItem(0) : items[0];
    http.getImage({
        url: 'https://source.unsplash.com/random',
        method: 'GET'
    }).then(data => {
        firstItem.image = data;
        const hasSet = !!items.setItem;
        if (hasSet) {
            items.setItem(0, firstItem)
        } else {
            items[0] = firstItem;
        }
        setTimeout(() => {
            listView.notifyPullToRefreshFinished();
        }, 1000);
    });
}