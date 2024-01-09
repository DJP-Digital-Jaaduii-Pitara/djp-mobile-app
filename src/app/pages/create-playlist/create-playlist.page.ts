import { Component, OnInit } from '@angular/core';
import { ContentService } from 'src/app/services/content/content.service';
import { PlaylistService } from 'src/app/services/playlist/playlist.service';
import { FilePicker, PickedFile } from '@capawesome/capacitor-file-picker';
import { PlayListContent} from '../../services/playlist/models/playlist.content'
import { AppHeaderService } from 'src/app/services';
import { Router } from '@angular/router';
import { MimeType, PlayerType } from 'src/app/appConstants';
import { ContentUtil } from 'src/app/services/content/util/content.util';
import { Location } from '@angular/common';

@Component({
  selector: 'app-create-playlist',
  templateUrl: './create-playlist.page.html',
  styleUrls: ['./create-playlist.page.scss'],
})

export class CreatePlaylistPage implements OnInit {
  contentList: Array<any> = [];
  playlists: any;
  playlistName = '';
  public files: PickedFile[] = [];
  resolveNativePath = (path : string) =>
  new Promise((resolve, reject) => {
    (window as any).FilePath.resolveNativePath(path, resolve, (err : any) => {
      console.error(
        `${path} could not be resolved by the plugin: ${err.message}`
      )
      reject(err)
    })
  });
  selectedContents: Array<any> = [];
  reSelectedContent: Array<any> = [];
  localContents: number = 0;
  status = '';
  constructor(
    private contentService: ContentService,
    private playListService: PlaylistService,
    private headerService: AppHeaderService,
    private router: Router,
    private location: Location
  ) {
    let extras = this.router.getCurrentNavigation()?.extras;
    if (extras) {
      if (extras.state?.['islocal']){
        this.playlists = extras.state?.['playlists'];
        this.selectedContents = this.playlists['playListcontentList'];
        this.selectedContents.map((e) => {
          e['isSelected'] = true;
          if (!e['metaData'] && e['content_metadata']) {
            e['metaData'] = JSON.parse(e['content_metadata'])
          }
        });
        this.playlistName = this.playlists.name;
        this.status = extras.state?.['status'];
      } else {
        this.selectedContents = extras.state?.['selectedContents'];
      }
      this.selectedContents = this.selectedContents.filter((e) => e['metaData']);
      this.reSelectedContent = this.selectedContents;
    }
  }

  ngOnInit() {
    this.getContentImgPath();
    this.contentService.getRecentlyViewedContent('guest').then((result) => {
      this.contentList = result;
      console.log('result', result)
    });
    this.headerService.headerEventEmitted$.subscribe((event) => {
      if (event === 'back' && this.status === 'edit') {
        this.location.back();
      }
    });
  }

  ionViewWillEnter() {
    this.headerService.showHeader('create New Playlist', true)
  }

  isContentSelect(event: any, index: any) {
    this.selectedContents[index]['isSelected'] = event.detail.checked;
    this.reSelectedContent = [];
    this.selectedContents.forEach((e: { [x: string]: any; }) => {
      if (e['isSelected']) {
        this.reSelectedContent.push({ identifier: e['metaData']['contentIdentifier']});
      }
    });
   }

  async createList() {
    let request: Array<PlayListContent> = [];
    this.selectedContents.forEach((e: any) => {
      if (e['isSelected']) {
        if (e['sourceType'] === 'local' || e['source'] === 'local') {
          request.push({identifier: e['metaData']['identifier'], type: 'local', localContent: e, isDeleted: false})
        } else {
          request.push({ identifier: e['contentIdentifier'], type: 'recentlyViewed' , localContent: e});
        }
      } else {
        if (e['sourceType'] === 'local' || e['source'] === 'local') {
          request.push({identifier: e['metaData']['identifier'], localContent: e,type: 'local', isDeleted: true})
        }
      }
    });
    if (this.playlistName) {
      let identifier = this.playlists ? this.playlists.identifier : undefined;
      this.playListService.createPlayList(this.playlistName, 'guest', request, identifier).then((data) => {
        // API
        this.headerService.deviceBackBtnEvent({name: 'backBtn'})
        if (this.status === 'edit') {
          this.location.back();
        } else {
          window.history.go(-2)
        }
      }).catch((err) => {
        console.log('errrrr', err)
      })
    }
  }


  public async openFilePicker() {
    let mimeType: string[] = [MimeType.PDF];
    mimeType = mimeType.concat(MimeType.VIDEOS).concat(MimeType.AUDIO);
    const { files } = await FilePicker.pickFiles({ types: mimeType, multiple: true, readData: true });
    this.files = files;
    files.map(async (file: any)=>{
      const path = await this.resolveNativePath(file.path!)
      console.log('path', path);
    })
    console.log('Files:::', files);
  }
  
  getContentImgPath(){
    this.selectedContents.forEach((ele) => {
      if (!ele.metaData['thumbnail']) {
        if (ele.metaData.mimetype === PlayerType.YOUTUBE) {
          ele.metaData['thumbnail'] = this.loadYoutubeImg(ele.metaData.identifier);
        } else {
          ele.metaData['thumbnail'] = ContentUtil.getImagePath(ele.metaData.mimetype || ele.metaData.mimeType)
        }
      }
    })
  }

  loadYoutubeImg(id: string): string {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }

}
