var ExceptionTableEntry = function(dStream, constantPool){
    this.start_pc = dStream.getU2();
    this.end_pc = dStream.getU2();
    this.handler_pc = dStream.getU2();
    var catchType = dStream.getU2();
    if (catchType){
        this.catch_type = ConstantPoolRef(catchType, constantPool,CONSTANT_Class);
    }else{
        this.catch_type = null;
    }
}

var InnerClass = function(dStream, constantPool){
    this.inner_class_info = ConstantPoolRef(dStream.getU2(), constantPool,CONSTANT_Class);
    var outerClassIndex = dStream.getU2();
    if (outerClassIndex){
        this.outer_class_info = ConstantPoolRef(outerClassIndex, constantPool,CONSTANT_Class);        
    }else{
        this.outer_class_info = null;   
    }
    this.inner_name = ConstantPoolRef(dStream.getU2(), constantPool,CONSTANT_Utf8);
    this.inner_class_access_flags = dStream.getU2();
}

var LineNumberTableEntry = function(dStream){
    this.start_pt = dStream.getU2();
    this.line_number = dStream.getU2();
}

var LocalVariableTableEntry = function(dStream, constantPool){
    this.start_pc = dStream.getU2();
    this.length  =dStream.getU2();
    this.name = ConstantPoolRef(dStream.getU2(), constantPool, CONSTANT_Utf8);
    this.descriptor = ConstantPoolRef(dStream.getU2(), constantPool, CONSTANT_Utf8);
    this.index = dStream.getU2();
}

var Attributes_table = {
    ConstantValue: function(){
        this.read = function(dStream, constantPool){
            this.constantvalue = ConstantPoolRef(dStream.getU2(), constantPool);
            switch(this.constantvalue.id){
            case CONSTANT_Long:
            case CONSTANT_Float:
            case CONSTANT_Double:
            case CONSTANT_Integer:
            case CONSTANT_String:
                return;
            default:
                throw "ConstantValue Attr points to wrong constant value, got " + constTagName(this.constantvalue.id);
                
            }
        }
    },

    Code: function(){
        this.read = function(dStream, constantPool){
            this.max_stack = dStream.getU2();
            this.max_locals = dStream.getU2();
            this.code_length = dStream.getU4();
            
            this.code = [];
            for (var i=0; i< this.code_length; i++){
                this.code[i] = dStream.getU1();
            }

            this.exception_table_length = dStream.getU2();
            this.exception_table = [];
            for (var i=0; i< this.exception_table_length; i++){
                this.exception_table[i] = new ExceptionTableEntry(dStream, constantPool);
                if (this.start_pc >= this.exception_table_length){
                    throw "Code attr Invalid Exception Table Entry, start_pc >= table length";
                }
                if (this.end_pc > this.exception_table_length){
                    throw "Code attr Invalid Exception Table Entry, end_pc > table length";
                }
                if (this.start_pc > this.end_pc){
                    throw "Code attr Invalid Exception Table Entry, start_pc > end_pc";
                }
                if (this.start_pc >= this.exception_table_length){
                    throw "Code attr Invalid Exception Table Entry, handler_pc >= table length";
                }
            }

            this.attributes_count = dStream.getU2();
            this.attributes = [];
            for(var i=0; i<this.attributes_count; i++){
                this.attributes[i] = Attribute(dStream,constantPool);
            }
        }
    },

    Exceptions: function(){
        this.read = function(dStream, constantPool){
            this.number_of_exceptions = dStream.getU2();
            this.exception_table = [];
            for(var i=0; i<this.number_of_exceptions; i++){
                this.exception_table[i] = ConstantPoolRef(dStream.getU2(), constantPool,CONSTANT_Class);
            }
        }
    },

    InnerClasses: function(){
        this.read = function(dStream, constantPool){
            this.number_of_classes = dStream.getU2();
            this.classes = [];
            for (var i=0; i<this.number_of_classes; i++){
                this.classes[i] = new InnerClass(dStream,constantPool);
            }
        }
    },

    Synthetic: function(){
        this.read = function(dStream,constantPool){
            if (this.attribute_length != 0){
                throw "Synthetic Attr length not 0";
            }
        }
    },

    SourceFile: function(){
        this.read = function(dStream,constantPool){
            this.soucefile = ConstantPoolRef(dStream.getU2(), constantPool,CONSTANT_Utf8);
        }
    },

    LineNumberTable: function(){
        this.read = function(dStream,constantPool){
            this.line_number_table_length = dStream.getU2();
            this.line_number_table = [];
            for (var i=0; i<this.line_number_table_length; i++){
                this.line_number_table[i] = new LineNumberTableEntry(dStream);
            }
        }
    },

    LocalVariableTable: function(){
        this.read=function(dStream,constantPool){
            this.local_variable_table_length = dStream.getU2();
            this.local_variable_table = [];
            for(var i=0; i<local_variable_table_length; i++){
                this.local_variable_table[i] = new LocalVariableTableEntry(dSteam,constantPool);
            }
        }
    },

    Deprecated: function(){
        this.read = function(dStream,constantPool){
            if (this.attribute_length != 0){
                throw "Synthetic Attr length not 0";
            }
        }
    }
};

function UnkownAttr(){
    this.read = function(dStream){
        this.info = [];
        for(var i=0; i<this.attribute_length; i++){
            this.info[i] = dStream.getU1();
        }
    }
}

var Attribute = function(dStream, constantPool){
    var attribute_name = ConstantPoolRef(dStream.getU2(), constantPool, CONSTANT_Utf8);
    var action = Attributes_table[attribute_name.str];
    var result;
    if (action){
        result = new action();
    }else{
        result = new UnkownAttr();
    }
    result.attribute_name = attribute_name;
    result.attribute_length = dStream.getU4();
    result.read(dStream, constantPool);
    return result;
}