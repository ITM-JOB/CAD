import {gearbox,chainDrive} from './geared-studies.mjs';
import {shaftMachine,jack} from './shaft-studies.mjs';
import {articulated,clutchStudy} from './coupling-studies.mjs';
export function studyModel(key){
 if(key==='60')return jack();
 if(key==='89'||key==='199')return chainDrive(key);
 if(['154','157','161','164'].includes(key))return gearbox(key);
 if(key==='263')return articulated();
 if(key.startsWith('281')||key.startsWith('296'))return clutchStudy(key);
 return shaftMachine(key);
}

