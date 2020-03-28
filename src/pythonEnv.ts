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

    getPackageDetails(packageName: string): Package | null {
        const packageDetail = new Package();
        let packageDetailRaw: string;
        try {
            packageDetailRaw = execSync(`${this.path} -m pip show ${packageName}`).toString().trim();
        } catch(err) {
            return null;
        }
     //   const packageDetail = packageDetailRaw.split(/\r\n/);
      
        for (const line of packageDetailRaw.split(/\r\n/)) {
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
                    packageDetail.requiredby =  value == "" ? [] : value.split(',').map(x => x.trim());
                    break; 
            }
        }
        return packageDetail;
    }

}


