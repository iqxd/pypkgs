import * as child_process from "child_process";
import { promisify } from "util";

const exec = promisify(child_process.exec);

class PkgInfo{
    name: string="";
    version: string="";
    summary: string="";
    homepage: string="";
    author: string="";
    authoremail: string="";
    license: string="";
    location: string="";
    requires: string[] =[];
    requiredby: string[] =[];
}

export class PythonEnv {
    private readonly path: string;
    
    constructor(path: string) {
        this.path = path;
    }

    async getIntepreterVersion(): Promise<string | null> {
        try {
            const { stdout, stderr } = await exec(`${this.path} -V`);
            const version = stdout;
            return version;
        } catch (error) {
            return null;
        }
    }

    async getPkgNameVerList(): Promise<Array<[string, string]>> {
        const { stdout ,stderr } = await exec(`${this.path} -m pip list`)

        const pkgNameVerRawTest = stdout;
        const pkgNameVerStringList = pkgNameVerRawTest.split(/\s+/);
			
        let pkgNameVerList: Array<[string, string]> = [];
        for (let i = 4; i < pkgNameVerStringList.length; i += 2) {    //start from 4 , skip the first two lines in raw text
            pkgNameVerList.push([pkgNameVerStringList[i], pkgNameVerStringList[i + 1]]);
        }
        return pkgNameVerList
    }

    async getPkgInfoList(pkgNameList: string | string[]): Promise<Array<PkgInfo | null>> {

        if (typeof pkgNameList == "string") {
            pkgNameList = [pkgNameList]
        }

        //reserve array by length, set null as default
        let pkgInfoList: Array<PkgInfo | null> = [];
        for (let i = 0; i < pkgNameList.length; i++)
            pkgInfoList.push(null);

        let pkgInfoRawText: string;

        try {
            const { stdout, stderr } = await exec(`${this.path} -m pip show ${pkgNameList.join(' ')}`);
            pkgInfoRawText = stdout;

            for (const para of pkgInfoRawText.split('\r\n---\r\n')) {
                let pkgInfo = new PkgInfo();
                for (const line of para.split(/\r\n/)) {
                    let index = line.search(":");
                    let name = line.substring(0, index).trim();
                    let value = line.substring(index + 1).trim();
                    //   let [name, value] = line.split(':').map(x => x.trim());
                    switch (name) {
                        case 'Name':
                            pkgInfo.name = value;
                            break;
                        case 'Version':
                            pkgInfo.version = value;
                            break;
                        case 'Summary':
                            pkgInfo.summary = value;
                            break;
                        case 'Home-page':
                            pkgInfo.homepage = value;
                            break;
                        case 'Author':
                            pkgInfo.author = value;
                            break;
                        case 'Author-email':
                            pkgInfo.authoremail = value;
                            break;
                        case 'License':
                            pkgInfo.license = value;
                            break;
                        case 'Location':
                            pkgInfo.location = value;
                            break;
                        case 'Requires':
                            pkgInfo.requires = value == "" ? [] : value.split(',').map(x => x.trim());
                            break;
                        case 'Required-by':
                            pkgInfo.requiredby = value == "" ? [] : value.split(',').map(x => x.trim());
                            break;
                    }
                }
                //replace the package by position in input array.
                for (let i = 0; i < pkgNameList.length; i++) {
                    if (pkgNameList[i] == pkgInfo.name) {
                        pkgInfoList[i] = pkgInfo;
                    }
                }
            }
            return pkgInfoList;

        } catch (error) {
            return pkgInfoList;
        }
       
        

    }

    async getPkgAllVers(pkgName: string): Promise<string[]> {
        // order from late version to early version
        let vers: string[] = [];
        try {
            const { stdout, stderr } = await exec(`${this.path} -m pip install ${pkgName}==`);
            return vers;
        } catch (error) {
            const versText:string = error.message.split('(from versions:')[1].split(')')[0];
            vers = versText.split(',').map(x=>x.trim()).reverse();
            return vers;
        }


        
    }
}


