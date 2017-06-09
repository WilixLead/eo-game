import {Injectable} from '@angular/core';
import {Md5} from 'ts-md5/dist/md5';

@Injectable()
export class AvatarsService {
  /**
   * Return avatar url
   * @param name
   * @return {string}
   */
  get(name: string) {
    let hash:string = Md5.hashStr(name) + '';
    return 'https://www.gravatar.com/avatar/' + hash + '?f=y&d=retro';
  }
}
