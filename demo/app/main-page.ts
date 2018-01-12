import * as observable from 'tns-core-modules/data/observable';
import * as pages from 'tns-core-modules/ui/page';
import { HelloWorldModel } from './main-view-model';
import { topmost } from 'tns-core-modules/ui/frame/frame';
let vm = new HelloWorldModel();
// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
  // Get the event sender
  let page = <pages.Page>args.object;
  page.bindingContext = vm;
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
