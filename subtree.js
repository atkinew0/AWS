//subtree counter
function TreeNode(val) {
        this.val = val;
        this.left = this.right = null;
}

function solve(root){

    let roots = []
    let ctr = 0;

function recurse(root,parent){

    console.log("node",root.val,"parent",parent)

    if(root.left == null && root.right == null){
        if(root.val == parent.val){
            ctr++;
            roots.push(root)
            return true;
        }
        else{
            return false;
        }
    }

    if(root.right && root.left) {

        if(recurse(root.right,root) && recurse(root.left,root)){
            if(root.right.val == root.val && root.left.val == root.val){
                roots.push(root)
                ctr++;
                return true;
            }
        }

    }else if(root.right){

        if(recurse(root.right,root)){
            ctr++;
            roots.push(root)
            return true;
        }

    }else if(root.left){

        if(recurse(root.left,root)){
            roots.push(root)
            ctr++
            return true;
        }

    }

    

}

recurse(root,null)
    console.log("called recurse")

    console.log("Answer",ctr)
    console.log(roots)
    return ctr;

}

let root = new TreeNode(1);
root.left = new TreeNode(1)
root.right = new TreeNode(2)
root.right.right = new TreeNode(2)
root.right.left = new TreeNode(2)

solve(root)