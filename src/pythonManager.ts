import * as child_process from "child_process";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from "util";
import * as glob from 'glob';

const exec = promisify(child_process.exec);

// export class PkgDetail {
//     name: string = "";
//     version: string = "";
//     summary: string = "";
//     homepage: string = "";
//     author: string = "";
//     authoremail: string = "";
//     license: string = "";
//     location: string = "";
//     requires: string[] = [];
//     requiredby: string[] = [];
// }

export interface PkgDetail {
    name: string,
    version: string,
    summary: string,
    homepage: string,
    author: string,
    authoremail: string,
    license: string,
    location: string,
    requires: string[],
    requiredby: string[],
}


// export class PkgVersInfo {
//     allvers: string[] = [];
// }

export class PythonManager {
    //public static intepreter: PythonManager | null;

    public readonly path: string;
    public readonly version: string | undefined;
    public readonly valid: boolean;

    public static checkVersion(path: string): string | undefined {
        try {
            const version = child_process.execSync(`${path} -V`).toString();
            return version;
        } catch (error) {
            return undefined;
        }
    }

    constructor(path: string) {
        this.path = path;
        this.version = PythonManager.checkVersion(path);
        if (this.version) {
            this.valid = true;
        } else {
            this.valid = false;
        }
    }


    async getPkgNameVerList(): Promise<Array<[string, string]>> {
        const { stdout, stderr } = await exec(`${this.path} -m pip list`)

        const pkgNameVerRawText = stdout;
        let pkgNameVerLineList = pkgNameVerRawText.split('\r\n');

        let pkgNameVerList: Array<[string, string]> = [];
        for (let i = 2; i < pkgNameVerLineList.length; i++) {    //start from 2 , skip the top two lines in raw text
            const [name, ver] = pkgNameVerLineList[i].split(/\s+/);
            if (name !== '') {
                pkgNameVerList.push([name, ver]);
            }
        }
        return pkgNameVerList
    }

    async getPkgDetailList(pkgNameList: string[]): Promise<PkgDetail[]> {

        let pkgDetailList: Array<PkgDetail> = [];

        const emptyDetail: PkgDetail = {
            name: '',
            version: '',
            summary: '',
            homepage: '',
            author: '',
            authoremail: '',
            license: '',
            location: '',
            requires: [],
            requiredby: [],
        }

        for (let i = 0; i < pkgNameList.length; i++)
            pkgDetailList.push({ ...emptyDetail });

        let pkgDetailRawText: string;

        try {
            const { stdout, stderr } = await exec(`${this.path} -m pip show ${pkgNameList.join(' ')}`);
            pkgDetailRawText = stdout;

            for (const para of pkgDetailRawText.split('\r\n---\r\n')) {
                let pkgDetail: PkgDetail = { ...emptyDetail };
                for (const line of para.split(/\r\n/)) {
                    let index = line.search(":");
                    let name = line.substring(0, index).trim();
                    let value = line.substring(index + 1).trim();
                    //   let [name, value] = line.split(':').map(x => x.trim());
                    switch (name) {
                        case 'Name':
                            pkgDetail.name = value;
                            break;
                        case 'Version':
                            pkgDetail.version = value;
                            break;
                        case 'Summary':
                            pkgDetail.summary = value;
                            break;
                        case 'Home-page':
                            pkgDetail.homepage = value;
                            break;
                        case 'Author':
                            pkgDetail.author = value;
                            break;
                        case 'Author-email':
                            pkgDetail.authoremail = value;
                            break;
                        case 'License':
                            pkgDetail.license = value;
                            break;
                        case 'Location':
                            const location = value;
                            let pkgSourceLocation: string;
                            // replace location by package folder path or script path(only one py file)
                            const currentPkgName = pkgDetail.name;
                            const singleScriptPath = path.join(location, currentPkgName + '.py');
                            let sourceFolderPath = path.join(location, currentPkgName);
                            if (fs.existsSync(singleScriptPath)) {
                                pkgSourceLocation = singleScriptPath;
                            } else if (fs.existsSync(sourceFolderPath)) {
                                pkgSourceLocation = sourceFolderPath;
                            } else {
                                //find top_level.txt for module name
                                const topLevelPattenPath = path.join(location, `${currentPkgName}-${pkgDetail.version}*-info/top_level.txt`)
                                const topLevelPattenPathAlter = path.join(location,`${currentPkgName.replace(/-/g,'_')}-${pkgDetail.version}*-info/top_level.txt`)
                                
                                let files = glob.sync(topLevelPattenPath);
                                let filesAlter = glob.sync(topLevelPattenPathAlter);
                                
                                let topLevelPath: string | undefined;
                                if (files.length === 1) {
                                    topLevelPath = files[0];
                                } else if (filesAlter.length === 1) {
                                    topLevelPath = filesAlter[0];
                                } else {
                                    topLevelPath = undefined;
                                }

                                if (topLevelPath) {
                                    pkgSourceLocation = ""; 
                                    const moduleNames = fs.readFileSync(topLevelPath).toString().trim().split(/\n/).map(x => x.trim());
                                    for (const moduleName of moduleNames) {
                                        sourceFolderPath = path.join(location, moduleName);
                                        if (fs.existsSync(sourceFolderPath)) {
                                            pkgSourceLocation = sourceFolderPath;
                                            break;
                                        } 
                                    }
                                } else {
                                    pkgSourceLocation = "";  // not find the top_level.txt path
                                }
                            }
                            pkgDetail.location = pkgSourceLocation;
                            break;
                        case 'Requires':
                            pkgDetail.requires = value == "" ? [] : value.split(',').map(x => x.trim());
                            break;
                        case 'Required-by':
                            pkgDetail.requiredby = value == "" ? [] : value.split(',').map(x => x.trim());
                            break;
                    }
                }
                //replace the package by position in input array.
                for (let i = 0; i < pkgNameList.length; i++) {
                    if (pkgNameList[i] == pkgDetail.name) {
                        pkgDetailList[i] = pkgDetail;
                    }
                }
            }
            return pkgDetailList;

        } catch (error) {
            return pkgDetailList;
        }



    }

    async getPkgValidVerList(pkgName: string): Promise<string[]> {
        // order from late version to early version
        let vers: string[] = [];
        try {
            const { stdout, stderr } = await exec(`${this.path} -m pip install ${pkgName}==`);

        } catch (error) {
            const versText: string = error.message.split('(from versions:')[1].split(')')[0];
            vers = versText.split(',').map(x => x.trim()).reverse();
        } finally {
            return vers;
        }



    }
}


