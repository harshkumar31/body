const img = document.getElementById('image');
    async function loadAndPredict() 
    {
      const net = await bodyPix.load(/** optional arguments, see below **/);
      const segmentation = await net.segmentPersonParts(img);
      console.log(segmentation);
      const pixel = segmentation.data; //1d matrix
      const height = segmentation.height; //height of matrix
      const width = segmentation.width; //width of matrix
      const pixel2d = matrix(height,width,pixel); //2d matrix
      const realHeight = 180; // Height of human in cm

      const s = scale(pixel2d,height,width,realHeight); //scaling factor
      console.log("Scaling Factor",s);

      const armL = armLength(pixel2d,height,width,s); 
      console.log("Arm Length",armL);
      const legL = legs(pixel2d,height,width,s);
      console.log("Leg Length",legL);
      const shoulderL = shoulder(pixel2d,height,width,s);
      console.log("Shoulder width",shoulderL);

      // MASKING
      const canvas = document.getElementById('canvas');
      const part = await bodyPix.toColoredPartMask(segmentation);
      bodyPix.drawMask(canvas,img,part,0.7,0,false);

      //Removing image
      //img.parentNode.removeChild(img);
    
      const armD = document.getElementById('armD');
      const LegD = document.getElementById('LegD');
      const ShouldD = document.getElementById('ShouldD');
      const scal = document.getElementById('scale');
      scal.innerHTML = "Scaling Factor :- " + s.toPrecision(4) + " px/cm";
      armD.innerHTML = "Arm Length :- " + armL.toPrecision(4) + " cm";
      LegD.innerHTML = "Leg Length :- " + legL.toPrecision(4) + " cm";
      ShouldD.innerHTML = "Shoulder width :- " + shoulderL.toPrecision(4) + " cm";
    }

    loadAndPredict();  

    function matrix( rows, cols, pixels)
    {
      var k = 0;
      var arr = [];
      
      // Creates all lines:
      for(var i=0; i < rows; i++){
    
          // Creates an empty line
          arr.push([]);
    
          // Adds cols to the empty line:
          arr[i].push( new Array(cols));
    
          for(var j=0; j < cols; j++){
            // Initializes:
            arr[i][j] = pixels[k++];
          }
      }
    return arr;
    }

    function armLength(arr,h,w,s)
    {
        let armtop_i = Number.MAX_VALUE, armtop_j = 0;
        let elbow_i = -1,elbow_j = 0,armBottomMiddle_i = -1,armBottomMiddle_j = 0;
        let armBottomRight_i = 0, armBottomRight_j = -1;

        for(let i=0;i<h;i++)
        {
            for(let j=0;j<w;j++)
            {
                if(arr[i][j] == 2 || arr[i][j] == 3)
                {
                    if(i<armtop_i)
                    {
                        armtop_i = i;
                        armtop_j = j;
                    }
                }
                if(arr[i][j] == 2 || arr[i][j] == 3)
                {
                    if(i>elbow_i)
                    {
                        elbow_i = i;
                        elbow_j = j;
                    }
                }
                if(arr[i][j] == 6 || arr[i][j] == 7)
                {
                    if(i>armBottomMiddle_i)
                    {
                        armBottomMiddle_i = i;
                        armBottomMiddle_j = j;
                    }
                }
                if(arr[i][j] == 6 || arr[i][j] == 7)
                {
                    if(j>armBottomRight_j)
                    {
                        armBottomRight_i = i;
                        armBottomRight_j = j;
                        //console.log(j);
                    }
                }
            }
        }

        //console.log(armtop_i);
        //console.log(armtop_j);
        //console.log(elbow_i);
        //console.log(elbow_j);
        //console.log(armBottomMiddle_i);
        //console.log(armBottomMiddle_j);
        //console.log(armBottomRight_i);
        //console.log(armBottomRight_j);

        let distT2E = Math.sqrt(Math.pow((armtop_i - elbow_i),2) + Math.pow((armtop_j - elbow_j),2));
        let distE2B;
        if((armBottomMiddle_i - armBottomRight_i) > 30)
        {
            distE2B = Math.sqrt(Math.pow((armBottomMiddle_i - elbow_i),2) + Math.pow((armBottomMiddle_j - elbow_j),2));
        }
        else
        {
            distE2B = Math.sqrt(Math.pow((armBottomRight_i - elbow_i),2) + Math.pow((armBottomRight_j - elbow_j),2));
        }
        let total = distE2B + distT2E;
        total = total * s;
        return total;
    }

    function scale(arr,h,w,realH)
    {
        let headtop_i = Number.MAX_VALUE, bottom_i = -1;
        for(let i=0;i<h;i++)
        {
            for(let j=0;j<w;j++)
            {
                if(arr[i][j] == 1 || arr[i][j] == 0)
                {
                    if(i<headtop_i)
                    {
                        headtop_i = i;
                    }
                }
                if(arr[i][j] == 22 || arr[i][j] == 23)
                {
                    if(i>bottom_i)
                    {
                        bottom_i = i;
                    }
                }
            }
        }
        let height = Math.abs(headtop_i - bottom_i);
        let scaled = realH/height;
        return scaled;
    }

    function legs(arr,h,w,s)
    {
        let legTop_i = Number.MAX_VALUE, legBottom_i = -1;
        for(let i=0;i<h;i++)
        {
            for(let j=0;j<w;j++)
            {
                if(arr[i][j] == 14 || arr[i][j] == 16)
                {
                    if(i<legTop_i)
                    {
                        legTop_i = i;
                    }
                }
                if(arr[i][j] == 18 || arr[i][j] == 20)
                {
                    if(i>legBottom_i)
                    {
                        legBottom_i = i;
                    }
                }
            }
        }
        let LegLength = Math.abs(legTop_i - legBottom_i);
        let ScaledLegLength = LegLength * s;
        return ScaledLegLength;
    }

    function shoulder(arr,h,w,s)
    {
        let shoulderLeft_j = Number.MAX_VALUE, shoulderRight_j = -1;
        for(let i=0;i<h;i++)
        {
            for(let j=0;j<w;j++)
            {
                if(arr[i][j] == 12)
                {
                    if(j<shoulderLeft_j)
                    {
                        shoulderLeft_j = j;
                    }
                    if(j>shoulderRight_j)
                    {
                        shoulderRight_j = j;
                    }
                }
            }
        }
        let shoulderLength = Math.abs(shoulderLeft_j - shoulderRight_j);
        let shoulderScaledLength = shoulderLength * s;
        return shoulderScaledLength;
    }

    function frontChest(arr,h,w,s)
    {
        let headtop_i = Number.MAX_VALUE, headbottom_i = -1;
        for(let i = 0; i < h; i++)
        {
            for(let j = 0; j < w; j++)
            {
                if(arr[i][j] == 0 || arr[i][j] == 1)
                {
                    if(i < headtop_i)
                    {
                        headtop_i = i;
                    }
                    if(i > headbottom_i)
                    {
                        headbottom_i = i;
                    }
                }
            }
        }
        let headsize = headbottom_i - headtop_i;
        let chestRow = headbottom_i + headsize;

        let chestLeft = Number.MAX_VALUE, chestRight = -1;
        for(let j = 0; j < w; j++)
        {
            if(arr[chestRow][j] == 12)
            {
                if(j < chestLeft)
                    chestLeft = j;
                if(j > chestRight)
                    chestRight = j;
            }
        }
        let chestFrontWidth = chestRight - chestLeft;
        let chestScaledFrontWidth = chestFrontWidth * s;
        return chestScaledFrontWidth;
    }

    function sideChest(arr,h,w,s)
    {
        let headtop_i = Number.MAX_VALUE, headbottom_i = -1;
        for(let i = 0; i < h; i++)
        {
            for(let j = 0; j < w; j++)
            {
                if(arr[i][j] == 0 || arr[i][j] == 1)
                {
                    if(i < headtop_i)
                    {
                        headtop_i = i;
                    }
                    if(i > headbottom_i)
                    {
                        headbottom_i = i;
                    }
                }
            }
        }
        let headsize = headbottom_i - headtop_i;
        let chestRow = headbottom_i + headsize;

        let chestLeft = Number.MAX_VALUE, chestRight = -1;
        for(let j = 0; j < w; j++)
        {
            if(arr[chestRow][j] != -1)
            {
                if(j < chestLeft)
                    chestLeft = j;
                if(j > chestRight)
                    chestRight = j;
            }
        }
        let chestSideWidth = chestRight - chestLeft;
        let chestScaledSideWidth = chestSideWidth * s;
        return chestScaledSideWidth;
    }

    function chestCircum(x,y)
    {
        let circum = Math.PI * ((3*x + 3*y) - Math.sqrt((x + 3*y)(3*x + y)));
        return circum;
    }

    function frontWaist(arr,h,w,s)
    {
        let headtop_i = Number.MAX_VALUE, bottom_i = -1;
        for(let i=0;i<h;i++)
        {
            for(let j=0;j<w;j++)
            {
                if(arr[i][j] == 1 || arr[i][j] == 0)
                {
                    if(i<headtop_i)
                    {
                        headtop_i = i;
                    }
                }
                if(arr[i][j] == 22 || arr[i][j] == 23)
                {
                    if(i>bottom_i)
                    {
                        bottom_i = i;
                    }
                }
            }
        }
        let height = Math.abs(headtop_i - bottom_i);
        let waistFromFoot = height*0.53;
        let waistX = bottom_i - waistFromFoot;
        waistX = Math.ceil(waistX);

        let waistLeft = Number.MAX_VALUE, waistRight = -1;
        for(let j = 0; j < w; j++)
        {
            if(arr[waistX][j] == 12)
            {
                if(j < waistLeft)
                    waistLeft = j;
                if(j > waistRight)
                    waistRight = j;
            }
        }
        waistWidth = (waistRight-waistLeft)*s;
        return waistWidth;
    }

    function sideWaist(arr,h,w,s)
    {
        let headtop_i = Number.MAX_VALUE, bottom_i = -1;
        for(let i=0;i<h;i++)
        {
            for(let j=0;j<w;j++)
            {
                if(arr[i][j] == 1 || arr[i][j] == 0)
                {
                    if(i<headtop_i)
                    {
                        headtop_i = i;
                    }
                }
                if(arr[i][j] == 22 || arr[i][j] == 23)
                {
                    if(i>bottom_i)
                    {
                        bottom_i = i;
                    }
                }
            }
        }
        let height = Math.abs(headtop_i - bottom_i);
        let waistFromFoot = height*0.53;
        let waistX = bottom_i - waistFromFoot;
        waistX = Math.ceil(waistX);

        let waistLeft = Number.MAX_VALUE, waistRight = -1;
        for(let j = 0; j < w; j++)
        {
            if(arr[waistX][j] != -1)
            {
                if(j < waistLeft)
                    waistLeft = j;
                if(j > waistRight)
                    waistRight = j;
            }
        }
        waistWidth = (waistRight-waistLeft)*s;
        return waistWidth;
    }

    function waistCircum(x,y)
    {
        let circum = Math.PI * ((3*x + 3*y) - Math.sqrt((x + 3*y)(3*x + y)));
        return circum;
    }

