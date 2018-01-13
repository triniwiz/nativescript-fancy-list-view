import { Injectable } from '@angular/core';

import { Item } from './item';

@Injectable()
export class ItemService {
    private items = [
        { id: 0, title: 'Slide 1', image: '~/images/Hulk_(comics_character).png' },
        {
            id: 1,
            title: 'Slide 2',
            image:
                'https://s-media-cache-ak0.pinimg.com/originals/4c/92/cc/4c92cc1dfbde6a6a40fe799f56fa9294.jpg'
        },
        {
            id: 2,
            title: 'Slide 3',
            image:
                'https://images.unsplash.com/photo-1487715433499-93acdc0bd7c3?auto=format&fit=crop&w=2228&q=80'
        },
        {
            id: 3,
            title: 'Slide 4',
            image:
                'http://img15.deviantart.net/60ea/i/2012/310/e/4/shazam_by_maiolo-d5k6fr5.jpg'
        },
        {
            id: 4,
            title: 'Slide 5',
            image: 'https://i.annihil.us/u/prod/marvel/i/mg/d/f0/558982863130d.jpg'
        },
        {
            id: 5,
            title: 'Slide 6',
            image:
                'https://images.unsplash.com/photo-1466872732082-8966b5959296?auto=format&fit=crop&w=2100&q=80'
        },
        {
            id: 6,
            title: 'Slide 7',
            image:
                'https://images.unsplash.com/photo-1464061884326-64f6ebd57f83?auto=format&fit=crop&w=2100&q=80'
        },
        {
            id: 7,
            title: 'Slide 8',
            image: 'http://cartoonbros.com/wp-content/uploads/2016/05/Batman-4.jpg'
        },
        {
            id: 8,
            title: 'Slide 9',
            image:
                'http://otakukart.com/animeblog/wp-content/uploads/2016/04/Kurama-Naruto.png'
        },
        {
            id: 9,
            title: 'Slide 10',
            image:
                'https://images.unsplash.com/photo-1474861644511-0f2775ae97cc?auto=format&fit=crop&w=2391&q=80'
        }];

    getItems(): Item[] {
        return this.items;
    }

    getItem(id: number): Item {
        return this.items.filter(item => item.id === id)[0];
    }
}
