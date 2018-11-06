import { Observable } from 'tns-core-modules/data/observable';
import { FancyListView } from 'nativescript-fancy-list-view';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';

export class HelloWorldModel extends Observable {
    public items = new ObservableArray([<any>{
        title: 'Item 1',
        image: '~/images/Hulk_(comics_character).png'
    }, {
        title: 'Item 2',
        image: 'https://s-media-cache-ak0.pinimg.com/originals/4c/92/cc/4c92cc1dfbde6a6a40fe799f56fa9294.jpg'
    }, {
        title: 'Item 3',
        image: 'https://images.unsplash.com/photo-1487715433499-93acdc0bd7c3?auto=format&fit=crop&w=2228&q=80'
    }, {
        title: 'Item 4',
        image: 'http://img15.deviantart.net/60ea/i/2012/310/e/4/shazam_by_maiolo-d5k6fr5.jpg'
    }, {title: 'Item 5', image: 'https://i.annihil.us/u/prod/marvel/i/mg/d/f0/558982863130d.jpg'}, {
        title: 'Item 6',
        image: 'https://images.unsplash.com/photo-1466872732082-8966b5959296?auto=format&fit=crop&w=2100&q=80'
    }, {
        title: 'Item 7',
        image: 'https://images.unsplash.com/photo-1464061884326-64f6ebd57f83?auto=format&fit=crop&w=2100&q=80'
    }, {
        title: 'Item 8',
        image: 'https://images.unsplash.com/photo-1539665315126-4cadf53fb20d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjF9&s=96994e4ef7a35fd4cd46ced235d0b8b1'
    }, {
        title: 'Item 9',
        image: 'http://otakukart.com/animeblog/wp-content/uploads/2016/04/Kurama-Naruto.png'
    }, {
        title: 'Item 10',
        image: 'https://images.unsplash.com/photo-1474861644511-0f2775ae97cc?auto=format&fit=crop&w=2391&q=80'
    }, {title: 'Item 11', image: '~/images/Hulk_(comics_character).png'}, {
        title: 'Item 12',
        image: 'https://s-media-cache-ak0.pinimg.com/originals/4c/92/cc/4c92cc1dfbde6a6a40fe799f56fa9294.jpg'
    }, {
        title: 'Item 13',
        image: 'https://images.unsplash.com/photo-1487715433499-93acdc0bd7c3?auto=format&fit=crop&w=2228&q=80'
    }, {
        title: 'Item 14',
        image: 'http://img15.deviantart.net/60ea/i/2012/310/e/4/shazam_by_maiolo-d5k6fr5.jpg'
    }, {title: 'Item 15', image: 'https://i.annihil.us/u/prod/marvel/i/mg/d/f0/558982863130d.jpg'}, {
        title: 'Item 16',
        image: 'https://images.unsplash.com/photo-1466872732082-8966b5959296?auto=format&fit=crop&w=2100&q=80'
    }, {
        title: 'Item 17',
        image: 'https://images.unsplash.com/photo-1464061884326-64f6ebd57f83?auto=format&fit=crop&w=2100&q=80'
    }, {
        title: 'Item 18',
        image: 'https://images.unsplash.com/photo-1539665315126-4cadf53fb20d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjF9&s=96994e4ef7a35fd4cd46ced235d0b8b1'
    }, {
        title: 'Item 19',
        image: 'http://otakukart.com/animeblog/wp-content/uploads/2016/04/Kurama-Naruto.png'
    }, {
        title: 'Item 20',
        image: 'https://images.unsplash.com/photo-1474861644511-0f2775ae97cc?auto=format&fit=crop&w=2391&q=80'
    },]);

    /*  public items = new ObservableArray(<any>[fromObject({
          title: 'Item 1',
          image: '~/images/Hulk_(comics_character).png'
      }), fromObject({
          title: 'Item 2',
          image: 'https://s-media-cache-ak0.pinimg.com/originals/4c/92/cc/4c92cc1dfbde6a6a40fe799f56fa9294.jpg'
      }), fromObject({
          title: 'Item 3',
          image: 'https://images.unsplash.com/photo-1487715433499-93acdc0bd7c3?auto=format&fit=crop&w=2228&q=80'
      }), fromObject({
          title: 'Item 4',
          image: 'http://img15.deviantart.net/60ea/i/2012/310/e/4/shazam_by_maiolo-d5k6fr5.jpg'
      }),
          fromObject({title: 'Item 5', image: 'https://i.annihil.us/u/prod/marvel/i/mg/d/f0/558982863130d.jpg'}),
          fromObject({
              title: 'Item 6',
              image: 'https://images.unsplash.com/photo-1466872732082-8966b5959296?auto=format&fit=crop&w=2100&q=80'
          }),
          fromObject({
              title: 'Item 7',
              image: 'https://images.unsplash.com/photo-1464061884326-64f6ebd57f83?auto=format&fit=crop&w=2100&q=80'
          }),
          fromObject({
              title: 'Item 8',
              image: 'https://images.unsplash.com/photo-1539665315126-4cadf53fb20d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjF9&s=96994e4ef7a35fd4cd46ced235d0b8b1'
          }),
          fromObject({
              title: 'Item 9',
              image: 'http://otakukart.com/animeblog/wp-content/uploads/2016/04/Kurama-Naruto.png'
          }),
          fromObject({
              title: 'Item 10',
              image: 'https://images.unsplash.com/photo-1474861644511-0f2775ae97cc?auto=format&fit=crop&w=2391&q=80'
          }),
          fromObject({title: 'Item 11', image: '~/images/Hulk_(comics_character).png'}),
          fromObject({
              title: 'Item 12',
              image: 'https://s-media-cache-ak0.pinimg.com/originals/4c/92/cc/4c92cc1dfbde6a6a40fe799f56fa9294.jpg'
          }),
          fromObject({
              title: 'Item 13',
              image: 'https://images.unsplash.com/photo-1487715433499-93acdc0bd7c3?auto=format&fit=crop&w=2228&q=80'
          }),
          fromObject({
              title: 'Item 14',
              image: 'http://img15.deviantart.net/60ea/i/2012/310/e/4/shazam_by_maiolo-d5k6fr5.jpg'
          }),
          fromObject({title: 'Item 15', image: 'https://i.annihil.us/u/prod/marvel/i/mg/d/f0/558982863130d.jpg'}),
          fromObject({
              title: 'Item 16',
              image: 'https://images.unsplash.com/photo-1466872732082-8966b5959296?auto=format&fit=crop&w=2100&q=80'
          }),
          fromObject({
              title: 'Item 17',
              image: 'https://images.unsplash.com/photo-1464061884326-64f6ebd57f83?auto=format&fit=crop&w=2100&q=80'
          }),
          fromObject({
              title: 'Item 18',
              image: 'https://images.unsplash.com/photo-1539665315126-4cadf53fb20d?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjF9&s=96994e4ef7a35fd4cd46ced235d0b8b1'
          }),
          fromObject({
              title: 'Item 19',
              image: 'http://otakukart.com/animeblog/wp-content/uploads/2016/04/Kurama-Naruto.png'
          }),
          fromObject({
              title: 'Item 20',
              image: 'https://images.unsplash.com/photo-1474861644511-0f2775ae97cc?auto=format&fit=crop&w=2391&q=80'
          }),]);*/
    private fancyListView: FancyListView;

    constructor() {
        super();
    }
}
