import { execSync } from "child_process"

class Package{
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
        const ver  = execSync(`${this.path} -V`).toString().trim();
        return ver;
    }

    getPackagesNameVersion(): Array<[string, string]>{
        const packagesRaw =  execSync(`${this.path} -m pip list`).toString().trim()
        const packagesList = packagesRaw.split(/\s+/);
			
        let packagesNameVersion : Array<[string,string]> = [] ;
        for (let i = 2; i < packagesList.length; i += 2) {
            packagesNameVersion.push([ packagesList[i], packagesList[i + 1]]) ;
        }
        return packagesNameVersion
    }

    getPackageDetails(packagesName: string | string[]): Array<Package|null> {

        if (typeof packagesName == "string") {
            packagesName = [packagesName]
        }

        //reserve array by length, set null as default
        let packagesDetail: Array<Package | null> = [];
        for (let i = 0; i < packagesName.length; i++)
            packagesDetail.push(null);

        let packagesDetailRaw: string;
        try {
            packagesDetailRaw = execSync(`${this.path} -m pip show ${packagesName.join(' ')}`).toString().trim();
        } catch(err) {
            return packagesDetail;
        }

        for (const para of packagesDetailRaw.split('\r\n---\r\n')) {
            let packageDetail = new Package();
            for (const line of para.split(/\r\n/)) {
                let index = line.search(":");
                let name = line.substring(0, index).trim();
                let value = line.substring(index + 1).trim();
                //   let [name, value] = line.split(':').map(x => x.trim());
                switch (name) {
                    case 'Name':
                        packageDetail.name = value;
                        break;
                    case 'Version':
                        packageDetail.version = value;
                        break;
                    case 'Summary':
                        packageDetail.summary = value;
                        break;
                    case 'Home-page':
                        packageDetail.homepage = value;
                        break;
                    case 'Author':
                        packageDetail.author = value;
                        break;
                    case 'Author-email':
                        packageDetail.authoremail = value;
                        break;
                    case 'License':
                        packageDetail.license = value;
                        break;
                    case 'Location':
                        packageDetail.location = value;
                        break;
                    case 'Requires':
                        packageDetail.requires = value == "" ? [] : value.split(',').map(x => x.trim());
                        break;
                    case 'Required-by':
                        packageDetail.requiredby = value == "" ? [] : value.split(',').map(x => x.trim());
                        break;
                }  
            }
            //replace the package by position in input array.
            for (let i = 0; i < packagesName.length; i++) {
                if (packagesName[i] == packageDetail.name) {
                    packagesDetail[i] = packageDetail;
                }
            }
        }
        return packagesDetail;
    }

}


