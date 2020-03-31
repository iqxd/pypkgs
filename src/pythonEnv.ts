import { execSync } from "child_process"

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

    getIntepreterVersion(): string {
        const ver = execSync(`${this.path} -V`).toString().trim();
        return ver;
    }

    getPkgNameVerList(): Array<[string, string]> {
        const pkgNameVerRawTest = execSync(`${this.path} -m pip list`).toString().trim()
        const pkgNameVerStringList = pkgNameVerRawTest.split(/\s+/);
			
        let pkgNameVerList: Array<[string, string]> = [];
        for (let i = 4; i < pkgNameVerStringList.length; i += 2) {    //start from 4 , skip the first two lines in raw text
            pkgNameVerList.push([pkgNameVerStringList[i], pkgNameVerStringList[i + 1]]);
        }
        return pkgNameVerList
    }

    getPkgInfoList(pkgNameList: string | string[]): Array<PkgInfo | null> {

        if (typeof pkgNameList == "string") {
            pkgNameList = [pkgNameList]
        }

        //reserve array by length, set null as default
        let pkgInfoList: Array<PkgInfo | null> = [];
        for (let i = 0; i < pkgNameList.length; i++)
            pkgInfoList.push(null);

        let pkgInfoRawText: string;
        try {
            pkgInfoRawText = execSync(`${this.path} -m pip show ${pkgNameList.join(' ')}`).toString().trim();
        } catch (err) {
            return pkgInfoList;
        }

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
    }

    getPkgAllVers(pkgName: string): string[] {
        // order from late version to early version
        let vers: string[] = [];
        try {
            execSync(`${this.path} -m pip install ${pkgName}==`).toString().trim();
        } catch (err)
        {
            const versText:string = err.message.split('(from versions:')[1].split(')')[0];
            vers = versText.split(',').map(x=>x.trim()).reverse();
        }
        return vers;
    }
}


